"""FastAPI app — Vote With Your Dollar backend v2."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(title="DollarVote API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from auth import router as auth_router
from api import router as api_router

app.include_router(auth_router)
app.include_router(api_router)


@app.get("/")
def root():
    return {"status": "ok", "version": "2.0.0", "engine": "FastAPI + MSSQL"}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=True)
