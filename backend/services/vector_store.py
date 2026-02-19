import asyncio
import os
import logging
from dotenv import load_dotenv
from typing import Optional, List
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)


class VectorStore:
    """Async-friendly vector store for agronomic knowledge.

    Heavy operations (file IO and Chroma init) run in threadpool via `asyncio.to_thread`.
    """

    def __init__(
        self,
        markdown_file: str = "agronomy_data.md",
        persist_directory: str = "../files/chroma_db",
        collection_name: str = "agronomic_knowledge_base",
        embedding_model: str = "text-embedding-3-small",
        embedding_api_key: Optional[str] = None,
        chunk_size: int = 800,
        chunk_overlap: int = 100,
    ):
        # store config only; heavy init is done in async `create`
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

        # placeholders to be initialized in create()
        self._chunks: List[Document] = []
        self._vector_store = None

    @classmethod
    async def create(
        cls,
        markdown_file: str = "agronomy_data.md",
        persist_directory: str = ".../files/chroma_db",
        collection_name: str = "agronomic_knowledge_base",
        embedding_model: str = "text-embedding-3-small",
        embedding_api_key: Optional[str] = None,
        chunk_size: int = 800,
        chunk_overlap: int = 100,
    ) -> "VectorStore":
        """Async factory that performs blocking initialization in threadpool."""
        self = cls(
            markdown_file=markdown_file,
            persist_directory=persist_directory,
            collection_name=collection_name,
            embedding_model=embedding_model,
            embedding_api_key=embedding_api_key,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        # run markdown processing and choma init in thread
        await asyncio.to_thread(self._sync_initialize)
        logger.info(f"VectorStore initialized with {len(self._chunks)} chunks")
        return self

    def _sync_initialize(self):
        """Synchronous initialization logic suitable for running in a thread."""
        logger.debug("Processing markdown and initializing vector store (sync thread)")
        self._chunks = self._process_markdown()
        self._vector_store = self._initialize_vector_store()

    def _process_markdown(self) -> List[Document]:
        logger.debug(f"Processing markdown file: {self.markdown_file}")
        try:
            with open(self.markdown_file, "r", encoding="utf-8") as f:
                markdown_content = f.read()
            logger.debug(f"Markdown file loaded: {len(markdown_content)} characters")

            headers_to_split_on = [("#", "Category"), ("##", "Topic")]
            header_splits = MarkdownHeaderTextSplitter(
                headers_to_split_on=headers_to_split_on
            ).split_text(markdown_content)
            logger.debug(f"Split into {len(header_splits)} header-based sections")

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap
            )
            chunks = splitter.split_documents(header_splits)
            logger.info(f"Markdown processed: {len(chunks)} chunks created")
            return chunks
        except Exception as e:
            logger.error(f"Error processing markdown: {str(e)}", exc_info=True)
            raise

    def _initialize_vector_store(self) -> Chroma:
        logger.debug(f"Initializing Chroma with persist_directory={self.persist_directory}")
        try:
            vector_store = Chroma.from_documents(
                documents=self._chunks,
                embedding=self.embeddings,
                persist_directory=self.persist_directory,
                collection_name=self.collection_name,
            )
            logger.info(f"Chroma vector store initialized successfully")
            return vector_store
        except Exception as e:
            logger.error(f"Error initializing vector store: {str(e)}", exc_info=True)
            raise

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

    def get_chunk_count(self) -> int:
        return len(self._chunks)

    def as_retriever(self, **kwargs):
        return self._vector_store.as_retriever(**kwargs)


if __name__ == "__main__":
    async def main():
        vs = await VectorStore.create()
        print(f"✅ Success! Indexed {vs.get_chunk_count()} chunks.")

    asyncio.run(main())
