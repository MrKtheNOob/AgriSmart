from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response


@dataclass(frozen=True)
class RateLimitRule:
    max_requests: int
    window_seconds: int


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rules: dict[tuple[str, str], RateLimitRule]):
        super().__init__(app)
        self.rules = rules
        self._events: dict[tuple[str, str, str], deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    @staticmethod
    def _client_ip(request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()

        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        rule = self.rules.get((request.method.upper(), request.url.path))
        if rule is None:
            return await call_next(request)

        client_ip = self._client_ip(request)
        now = time.time()
        key = (client_ip, request.method.upper(), request.url.path)

        async with self._lock:
            bucket = self._events[key]
            cutoff = now - rule.window_seconds
            while bucket and bucket[0] < cutoff:
                bucket.popleft()

            if len(bucket) >= rule.max_requests:
                retry_after = max(1, int(rule.window_seconds - (now - bucket[0])))
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests from this IP for this route.",
                        "retry_after_seconds": retry_after,
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)

        return await call_next(request)
