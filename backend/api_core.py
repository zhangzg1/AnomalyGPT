import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model import router as anomaly_router

app = FastAPI()
app.include_router(anomaly_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/test")
async def test(name: str):
    return {"message": f"Hello {name}"}


if __name__ == '__main__':
    uvicorn.run(app=app, host="127.0.0.1", port=8000, workers=1)
