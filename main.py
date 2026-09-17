from fastapi import FastAPI, HTTPException, Path, Query 
import json

app = FastAPI()


def load_data():
    with open("job_applications.json",'r') as f:
        data =json.load(f)
    return data


@app.get("/")
def hello():
    return {"message":"Job application Tracker System API."}

@app.get("/about")
def about():
    return {"message":"A fully functional job application tracker system API built with FastAPI."} 

@app.get("/applications")
def applications():
    data = load_data()
    return data

@app.get("/applications/sort")
def sort_applications(sort_by: str=Query(
    ...,description="The field to sort the applications by.", 
    examples="role")):
    data = load_data()
    
    valid_fields =['role', 'company', 'status', 'date_applied']
    
    if sort_by not in valid_fields:
        raise HTTPException(status_code=400, detail = "Invalid sort field. Valid fields are: role, company, status, date_applied.")
    
    sorted_data = sorted(data.values(), key=lambda x: x[sort_by])
    return sorted_data
@app.get("/applications/{id}")
def view_applications(id:str =Path(..., description="The ID of the application to retrieve.", examples="A001")):
    data = load_data()
    
    if id in data:
        return data[id]
    
    raise HTTPException(status_code=404, detail ="Application not found.")
