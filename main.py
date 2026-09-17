from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def hello():
    return {"message":"Hello"}

@app.get("/about")
def about():
    return {"message":"Started to written a code of job tracker"} 

