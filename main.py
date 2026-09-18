from fastapi import FastAPI, HTTPException, Path, Query 
import json
from pydantic import BaseModel, AnyUrl, Field
from typing import Optional, Annotated
from datetime import date 
from fastapi.responses import JSONResponse

app = FastAPI()

class Application(BaseModel):
    company: str
    role: str
    status: str
    date_applied: date = Field(default_factory=date.today)
    location: Optional[str] = None
    job_type: Optional[str] = None
    application_source: Optional[str] = None
    job_url: Optional[AnyUrl] = None
    salary: Optional[str] = None
    interview_date: Optional[date] = None
    notes: Annotated[Optional[str], Field(None, max_length=200, description="Additional notes or comments about the application.")] = None

class ApplicationUpdate(BaseModel):
    company: Optional[str]=None
    role: Optional[str]=None
    status: Optional[str]=None
    date_applied : Optional[date]=None
    location: Optional[str] = None
    job_type: Optional[str] = None
    application_source: Optional[str] = None
    job_url: Optional[AnyUrl] = None
    salary: Optional[str] = None
    interview_date: Optional[date] = None
    notes: Annotated[Optional[str], Field(None, max_length=200, description="Additional notes or comments about the application.")] = None

class ApplicationFilter(BaseModel):
    company: Optional[str]=None
    role: Optional[str]=None
    status: Optional[str]=None
    date_applied : Optional[date]=None
    location: Optional[str] = None
    job_type: Optional[str] = None
    application_source: Optional[str] = None
    job_url: Optional[AnyUrl] = None
    salary: Optional[str] = None
    interview_date: Optional[date] = None

def generate_new_id(data) -> str:
    if not data:
        return "A001"
    else:
        # keys = list(data.keys())
        numbers =[]
        for key in data.keys():
            try:
                number = int(key[1:])
                numbers.append(number)
            except ValueError:
                print(f"Invalid key format: {key}. Skipping.")
        if not numbers:
            return "A001"
        highest_number = max(numbers)
        new_number = highest_number +1
        new_id = f"A{new_number:03d}"
        return new_id

def load_data():
    with open("job_applications.json",'r') as f:
        data =json.load(f)
    return data

def save_data(data):
    with open('job_applications.json','w') as f:
        json.dump(data, f, indent=4)

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

@app.get("/applications/stats")
def application_stats():
    data=load_data()
    
    total_applications=len(data)
    
    status_counts ={"Offer":0, "Rejected":0, "Interviewing":0, "Applied":0}
    
    for application in data.values():
        status = application.get("status")
        if status in status_counts:
            status_counts[status] += 1
        else:
            status_counts[status] = 1
            
    source_breakdown={"Company Website":0, "LinkedIn":0, "Referral":0,"Naukri":0}
    for application in data.values():
        source = application.get("application_source")
        if source in source_breakdown:
            source_breakdown[source] +=1
        else:
            source_breakdown[source] =1
            
    location_Counts = {"Pune":0, "Mysore":0,"Bangalore":0,"Remote":0,"Hyderabad":0, "Noida":0, "Mumbai":0, "Gurugram":0}
    for application in data.values():
        location = application.get("location")
        if location in location_Counts:
            location_Counts[location] +=1
        else:
            location_Counts[location] =1
            
    Conversion_Rate = status_counts["Offer"]
    success= (Conversion_Rate/total_applications)*100
    
    oldest_pending = None
    oldest_date = None
    for id, application_info in data.items():
        if application_info["status"] in ["Applied", "Interviewing"]:
            current_date = application_info['date_applied']
            if oldest_date is None:
                oldest_date = current_date
                oldest_pending = {
                    "id": id,
                    "company": application_info["company"],
                    "date_applied": current_date
                }
    
            elif current_date < oldest_date:
                oldest_date = current_date
                oldest_pending={
                    "id":id,
                    "company":application_info["company"],
                    "date_applied":current_date
                }
    return {
        "total_applications": total_applications,
        "status_counts": status_counts,
        "source_breakdown":source_breakdown,
        "location_Counts": location_Counts,
        "success_rate_percent":success,
        "Oldest_pending_application":oldest_pending
    }

@app.get("/applications/filter")
def filter_applications(filter: ApplicationFilter):
    data = load_data()
    filter_criteria = filter.model_dump(mode='json', exclude_unset=True)
    filtered_data = []
    
    for application_id, application_info in data.items():
        match = True
        for key, value in filter_criteria.items():
            if application_info.get(key) != value:
                match = False
                break
        if match:
            filtered_data[application_id] = application_info
            
    return filtered_data

@app.get("/applications/{id}")
def view_applications(id:str =Path(..., description="The ID of the application to retrieve.", examples="A001")):
    data = load_data()
    if id in data:
        return data[id]
    
    raise HTTPException(status_code=404, detail ="Application not found.")

@app.post("/applications/create")
def create_application(application:Application):
    data =load_data()
    new_id = generate_new_id(data)
    data[new_id]= application.model_dump(mode="json", exclude_unset=True)
    save_data(data)
    
    return JSONResponse(status_code=201, content={"message": "Application created successfully.", "id": new_id})
    
    
@app.put("/applications/update/{id}")
def update_application(id:str, application_update:ApplicationUpdate):
    
    data = load_data()
    if id not in data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    existing_application_info = data[id]
    update_application_info = application_update.model_dump(mode='json', exclude_unset=True)
    
    existing_application_info.update(update_application_info)
        
    data[id] = existing_application_info
    save_data(data)
    return JSONResponse(status_code=200, content={"message":"Application updated successfully.", "id":id, "application":data[id]})

@app.delete("/applications/delete/{id}")
def delete_applications(id: str):
    data = load_data()
    
    if id not in data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    del data[id]
    save_data(data)
    return JSONResponse(status_code=200, content={"message":"Application deleted successfully.","id":id})


        