import asyncio
import json
import os
import logging
from dotenv import load_dotenv
from typing import Optional, List
import hashlib
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

class VectorStore:
    """
    Async-friendly vector store for agronomic knowledge.

    - Loads existing Chroma DB if unchanged
    - Rebuilds only when markdown changes
    - Heavy operations run in threadpool via asyncio.to_thread
    """

    META_FILENAME = "meta.json"

    def __init__(
        self,
        markdown_file: str,
        persist_directory: str,
        collection_name: str,
        embedding_model: str,
        embedding_api_key: Optional[str],
        chunk_size: int,
        chunk_overlap: int,
    ):
        load_dotenv()
        os.environ["CHROMA_TELEMETRY_OFF"] = "True"

        self.markdown_file = markdown_file
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        api_key = embedding_api_key or os.getenv("EMBEDDING_KEY")
        if api_key:
            os.environ["OPENAI_API_KEY"] = api_key

        self.embeddings = OpenAIEmbeddings(
            model=embedding_model,
            base_url="https://openrouter.ai/api/v1",
        )

        self._vector_store: Chroma

    # --------------------------
    # Async Factory
    # --------------------------

    @classmethod
    async def create(
        cls,
        markdown_file: str,
        persist_directory: str,
        collection_name: str = "agronomic_knowledge_base",
        embedding_model: str = "text-embedding-3-small",
        embedding_api_key: Optional[str] = None,
        chunk_size: int = 800,
        chunk_overlap: int = 100,
    ) -> "VectorStore":

        self = cls(
            markdown_file,
            persist_directory,
            collection_name,
            embedding_model,
            embedding_api_key,
            chunk_size,
            chunk_overlap,
        )

        await asyncio.to_thread(self._initialize)
        return self

    # --------------------------
    # Core Initialization Logic
    # --------------------------

    def _initialize(self):
        os.makedirs(self.persist_directory, exist_ok=True)

        if self._should_rebuild():
            logger.info("Changes detected in knowledge base. Rebuilding vector store...")
            self._build_store()
        else:
            logger.info("Knowledge base unchanged. Loading existing vector store...")
            self._load_store()

    # --------------------------
    # Build vs Load Logic
    # --------------------------

    def _build_store(self):
        documents = self._process_markdown()

        self._vector_store = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name=self.collection_name,
        )
        self._store_hash()
        logger.info(f"Vector store built and persisted with {len(documents)} chunks.")

    def _load_store(self):
        self._vector_store = Chroma(
            persist_directory=self.persist_directory,
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
        )
        logger.info("Vector store loaded from disk.")

    # --------------------------
    # Markdown Processing
    # --------------------------

    def _process_markdown(self) -> List[Document]:
        with open(self.markdown_file, "r", encoding="utf-8") as f:
            content = f.read()

        header_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=[("#", "Category"), ("##", "Topic")]
        )

        sections = header_splitter.split_text(content)

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )

        return splitter.split_documents(sections)

    # --------------------------
    # Hash Logic
    # --------------------------

    def _file_hash(self) -> str:
        with open(self.markdown_file, "rb") as f:
            return hashlib.md5(f.read()).hexdigest()

    def _meta_path(self) -> str:
        return os.path.join(self.persist_directory, self.META_FILENAME)

    def _should_rebuild(self) -> bool:
        meta_path = self._meta_path()

        if not os.path.exists(meta_path):
            return True

        try:
            with open(meta_path, "r") as f:
                stored_hash = json.load(f).get("source_hash")
            return stored_hash != self._file_hash()
        except Exception:
            return True

    def _store_hash(self):
        with open(self._meta_path(), "w") as f:
            json.dump({"source_hash": self._file_hash()}, f)

    # --------------------------
    # Public API
    # --------------------------

    # def similarity_search(self, query: str, k: int = 5):
    #     if not self._vector_store:
    #         raise RuntimeError("Vector store not initialized.")
    #     return self._vector_store.similarity_search(query, k=k)

    async def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Async wrapper around blocking similarity_search."""
        logger.debug(f"Similarity search: query='{query[:50]}...', k={k}")
        try:
            return await asyncio.to_thread(self._vector_store.similarity_search, query, k)
        except Exception as e:
            logger.error(f"Error in similarity search: {str(e)}", exc_info=True)
            raise

    async def similarity_search_with_score(self, query: str, k: int = 4) -> List:
        return await asyncio.to_thread(self._vector_store.similarity_search_with_score, query, k)

    async def add_documents(self, documents: List[Document]) -> List[str]:
        return await asyncio.to_thread(self._vector_store.add_documents, documents)

    def as_retriever(self, **kwargs):
        return self._vector_store.as_retriever(**kwargs)


if __name__ == "__main__":
    async def main():
        logging.basicConfig(level=logging.INFO)
        # Placeholder paths for testing
        markdown_file = "../data/RAG/agronomy_data.md"
        persist_directory = "../data/RAG/chroma_db"
        await VectorStore.create(markdown_file=markdown_file, persist_directory=persist_directory)
        print("✅ Success! Vector store initialized.")

    asyncio.run(main())
