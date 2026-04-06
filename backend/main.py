from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
import pymysql
from database import get_db_connection, init_db
import os
import uuid
from services import upload_image_to_azure_blob, delete_image_from_azure_blob

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://barcode-frontend-noex.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error: {exc.errors()}")
    print(f"Request body: {exc.body}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": exc.errors(), "body": exc.body}),
    )

@app.on_event("startup")
async def startup():
    init_db()

class User(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[int] = None

class LoginData(BaseModel):
    email: str
    password: str

class DeleteBarcodeData(BaseModel):
    barcode: str
    email: str

class BarcodeData(BaseModel):
    barcode: str
    email: str

class ImageUploadRequest(BaseModel):
    images: List[str]
    barcode: str
    email: str
    full_name: str
    department: Optional[int] = None
    customer_name: Optional[str] = None
    expected_ship_date: Optional[str] = None
    bol_number: Optional[str] = None

@app.post("/api/register")
async def register(user: User):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO barcode_user (email, password, first_name, last_name, department) VALUES (%s, %s, %s, %s, %s)",
            (user.email, user.password, user.first_name, user.last_name, user.department)
        )
        conn.commit()
        return {"success": True, "message": "User registered"}
    except pymysql.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        cursor.close()
        conn.close()

@app.post("/api/login")
async def login(data: LoginData):
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute(
        "SELECT email, first_name, last_name, department, role FROM barcode_user WHERE email = %s AND password = %s",
        (data.email, data.password)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    print(f"Login successful for user: {user}")
    return {"success": True, "user": user}

@app.post("/api/barcode")
async def process_barcode(data: BarcodeData):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO barcode_scans (barcode, email) VALUES (%s, %s)",
        (data.barcode, data.email)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "data": {"barcode": data.barcode, "email": data.email}}

@app.get("/api/barcodes")
async def get_barcodes():
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT * FROM barcode_scans ORDER BY timestamp DESC")
    barcodes = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"barcodes": barcodes}



@app.get("/api/my-info")
async def get_my_info(email: str):
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    
    # This query ensures that only the most recent entry for each barcode is returned.
    query = """
        WITH RankedRecords AS (
            SELECT 
                *,
                ROW_NUMBER() OVER(PARTITION BY barcode ORDER BY date DESC) as rn
            FROM Barcode_Info
            WHERE email = %s
        )
        SELECT * FROM RankedRecords WHERE rn = 1 ORDER BY date DESC;
    """
    
    cursor.execute(query, (email,))
    records = cursor.fetchall()
    
    for rec in records:
        # The rest of the logic remains the same.
        rec['images'] = json.loads(rec.get('images', '[]') or '[]')
            
    cursor.close()
    conn.close()
    return {"records": records}

@app.get("/api/admin/users")
async def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT id, email, first_name, last_name, department, role, created_at FROM barcode_user")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"users": users}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM barcode_user WHERE id = %s", (user_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True}

@app.put("/api/admin/users/{user_id}")
async def update_user(user_id: int, user: User):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE barcode_user SET first_name = %s, last_name = %s, department = %s WHERE id = %s",
        (user.first_name, user.last_name, user.department, user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True}

@app.get("/api/admin/all-info")
async def get_all_info():
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    # Join with barcode_user to get the authoritative user name
    sql = """
        SELECT 
            bi.*, 
            bu.first_name, 
            bu.last_name 
        FROM Barcode_Info bi
        JOIN barcode_user bu ON bi.email = bu.email
        ORDER BY bi.date DESC
    """
    cursor.execute(sql)
    records = cursor.fetchall()
    for rec in records:
        # Combine first and last name for the full_name field
        rec['full_name'] = f"{rec.get('first_name', '')} {rec.get('last_name', '')}".strip()
        rec['images'] = json.loads(rec.get('images', '[]') or '[]')
    cursor.close()
    conn.close()
    return {"records": records}

@app.put("/api/change-password")
async def change_password(data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE barcode_user SET password = %s WHERE email = %s AND password = %s",
        (data['new_password'], data['email'], data['old_password'])
    )
    affected = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    if affected == 0:
        raise HTTPException(status_code=400, detail="Invalid old password")
    return {"success": True, "message": "Password changed"}

# -----------------------------------------------------------------------------
# New endpoint for importing CSV barcodes (applied as per the suggestion)
# -----------------------------------------------------------------------------

import csv
import io

@app.post("/api/import-csv")
async def import_csv(email: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    try:
        decoded_content = content.decode('utf-8')
        csv_reader = csv.reader(io.StringIO(decoded_content))

        # --- Shipping List creation logic START ---
        file_name = file.filename.split('.')[0] # Get name without extension

        conn_sl = get_db_connection() # Separate connection for shipping list creation
        cursor_sl = conn_sl.cursor()
        shipping_list_id = None

        try:
            # Check if a shipping list with this name already exists for this user
            cursor_sl.execute(
                "SELECT id FROM shipping_lists WHERE list_name = %s AND uploaded_by_email = %s",
                (file_name, email)
            )
            existing_list = cursor_sl.fetchone()

            if existing_list:
                shipping_list_id = existing_list[0]
            else:
                # Create new shipping list entry
                cursor_sl.execute(
                    "INSERT INTO shipping_lists (list_name, uploaded_by_email) VALUES (%s, %s)",
                    (file_name, email)
                )
                conn_sl.commit()
                shipping_list_id = cursor_sl.lastrowid # Get the ID of the newly inserted list
        except Exception as e:
            conn_sl.rollback()
            raise HTTPException(status_code=500, detail=f"Error creating/fetching shipping list: {e}")
        finally:
            cursor_sl.close()
            conn_sl.close()
        # --- Shipping List creation logic END ---

        header = next(csv_reader)
        # Get indices for all required columns
        try:
            skid_index = header.index("Skid")
            customer_name_index = header.index("Customer name")
            expected_ship_date_index = header.index("Expected Ship Date")
            bol_number_index = header.index("BOL #")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"CSV file must have all required columns: Skid, Customer name, Expected Ship Date, BOL #. Missing: {e}")

        # Prepare data for bulk insert
        barcode_data_to_insert = []
        for row in csv_reader:
            # Skip empty rows or rows that don't have enough columns
            if not row or len(row) <= max(skid_index, customer_name_index, expected_ship_date_index, bol_number_index):
                continue

            barcode = row[skid_index].strip()
            customer_name = row[customer_name_index].strip()
            expected_ship_date_str = row[expected_ship_date_index].strip()
            bol_number = row[bol_number_index].strip()

            if not barcode: # Skip rows with empty barcode
                continue

            # Basic date validation for multiple formats
            expected_ship_date = None
            if expected_ship_date_str:
                date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%#m/%#d/%Y'] # YYYY-MM-DD, M/D/YYYY, M/D/YYYY (Windows specific # for no zero-padding)
                for fmt in date_formats:
                    try:
                        expected_ship_date = datetime.strptime(expected_ship_date_str, fmt).strftime('%Y-%m-%d')
                        break # Exit loop if parsing is successful
                    except ValueError:
                        pass

            barcode_data_to_insert.append((barcode, customer_name, expected_ship_date, bol_number))

        if not barcode_data_to_insert:
            raise HTTPException(status_code=400, detail="No valid barcode records found in the CSV file.")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {e}")

    conn = get_db_connection()
    cursor = conn.cursor()
    inserted = 0
    try:
        for bc, customer_name, expected_ship_date, bol_number in barcode_data_to_insert:
            # Check if the barcode already exists for this user to avoid duplicates
            cursor.execute("SELECT id FROM Barcode_Info WHERE barcode = %s AND email = %s", (bc, email))
            if cursor.fetchone():
                continue # Skip if it already exists

            cursor.execute(
                "INSERT INTO Barcode_Info (barcode, customer_name, expected_ship_date, bol_number, images, full_name, email, shipping_list_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (bc, customer_name, expected_ship_date, bol_number, "[]", '', email, shipping_list_id) # Add shipping_list_id
            )
            inserted += 1
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

    return {"success": True, "inserted": inserted, "message": f"Successfully inserted {inserted} new barcodes."}

@app.get("/api/customer-names")
async def get_customer_names():
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.execute("SELECT DISTINCT customer_name FROM Barcode_Info WHERE customer_name IS NOT NULL AND customer_name != '' ORDER BY customer_name ASC")
        customer_names = [row["customer_name"] for row in cursor.fetchall()]
        return {"customer_names": customer_names}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/shipping-lists")
async def get_shipping_lists(customer_name: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        query = """
            SELECT DISTINCT
                sl.id,
                sl.list_name,
                sl.uploaded_by_email,
                sl.upload_date
            FROM
                shipping_lists sl
            LEFT JOIN
                Barcode_Info bi ON sl.id = bi.shipping_list_id
            WHERE 1=1
        """
        params = []

        if customer_name:
            query += " AND bi.customer_name LIKE %s"
            params.append(f"%{customer_name}%")

        query += " ORDER BY sl.list_name ASC"

        cursor.execute(query, tuple(params))
        shipping_lists = cursor.fetchall()
        return {"shipping_lists": shipping_lists}
    except Exception as e:
        print(f"Error in get_shipping_lists: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/shipping-list/{list_id}/barcodes")
async def get_barcodes_by_shipping_list(list_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        query = """
            SELECT
                bi.*,
                bu.first_name,
                bu.last_name
            FROM Barcode_Info bi
            JOIN barcode_user bu ON bi.email = bu.email
            WHERE bi.shipping_list_id = %s
            ORDER BY bi.date DESC
        """
        cursor.execute(query, (list_id,))
        records = cursor.fetchall()

        for rec in records:
            rec['full_name'] = f"{rec.get('first_name', '')} {rec.get('last_name', '')}".strip()
            rec['images'] = json.loads(rec.get('images', '[]') or '[]')

        return {"records": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/barcode/search")
async def search_barcode(barcode: str):
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        query = """
            SELECT
                bi.*,
                bu.first_name,
                bu.last_name
            FROM Barcode_Info bi
            JOIN barcode_user bu ON bi.email = bu.email
            WHERE bi.barcode = %s
            ORDER BY bi.date DESC
        """
        cursor.execute(query, (barcode,))
        records = cursor.fetchall()

        for rec in records:
            rec['full_name'] = f"{rec.get('first_name', '')} {rec.get('last_name', '')}".strip()
            rec['images'] = json.loads(rec.get('images', '[]') or '[]')

        return {"records": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

@app.delete("/api/barcode/{barcode_value}")
async def delete_barcode(barcode_value: str, data: DeleteBarcodeData):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Also delete associated scans from barcode_scans for data integrity
        cursor.execute(
            "DELETE FROM barcode_scans WHERE barcode = %s AND email = %s",
            (barcode_value, data.email)
        )
        
        cursor.execute(
            "DELETE FROM Barcode_Info WHERE barcode = %s AND email = %s",
            (barcode_value, data.email)
        )
        
        deleted_count = cursor.rowcount
        conn.commit()

        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="Barcode not found for the given user.")

        return {"success": True, "message": "Barcode deleted successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

class ImageDeleteData(BaseModel):
    barcode: str
    email: str
    index: int

@app.post("/api/barcode/add-image")
async def add_barcode_image(data: ImageUploadRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Fetch existing images for the barcode
        cursor.execute("SELECT images FROM Barcode_Info WHERE barcode = %s", (data.barcode,))
        row = cursor.fetchone()
        
        if row is None:
            # If no existing record, create a new one with initial data
            image_urls = []
            for base64_image in data.images:
                file_name = f"{uuid.uuid4()}.png" # Generate unique filename
                image_url = await upload_image_to_azure_blob(base64_image, data.barcode, file_name)
                image_urls.append(image_url)

            new_image_entries = []
            for url in image_urls:
                new_image_entries.append({
                    "url": url,
                    "added_by_email": data.email,
                    "added_by_name": data.full_name,
                    "added_date": datetime.now().isoformat()
                })

            cursor.execute(
                "INSERT INTO Barcode_Info (images, barcode, full_name, department, email, customer_name, expected_ship_date, bol_number) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (json.dumps(new_image_entries), data.barcode, data.full_name, data.department, data.email, data.customer_name, data.expected_ship_date, data.bol_number)
            )
            conn.commit()
            return {"success": True, "message": "New barcode record created with image", "images": new_image_entries}
        
        else:
            # If record exists, update it
            existing_images_json = row[0]
            existing_images = json.loads(existing_images_json) if existing_images_json else []

            uploaded_image_urls = []
            for base64_image in data.images:
                file_name = f"{uuid.uuid4()}.png" # Generate unique filename
                image_url = await upload_image_to_azure_blob(base64_image, data.barcode, file_name)
                uploaded_image_urls.append(image_url)

            new_image_entries = []
            for url in uploaded_image_urls:
                new_image_entries.append({
                    "url": url,
                    "added_by_email": data.email,
                    "added_by_name": data.full_name,
                    "added_date": datetime.now().isoformat()
                })
            
            updated_images = existing_images + new_image_entries

            cursor.execute(
                "UPDATE Barcode_Info SET images = %s WHERE barcode = %s",
                (json.dumps(updated_images), data.barcode)
            )
            conn.commit()
            return {"success": True, "images": updated_images}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add image: {e}")
    finally:
        cursor.close()
        conn.close()

@app.post("/api/barcode/delete-image")
async def delete_barcode_image(data: ImageDeleteData):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Fetch existing images for the barcode
        cursor.execute(
            "SELECT id, images FROM Barcode_Info WHERE barcode = %s",
            (data.barcode,)
        )
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Barcode not found")

        record_id, images_json = row

        images = json.loads(images_json) if images_json else []

        if not (0 <= data.index < len(images)):
            raise HTTPException(status_code=400, detail="Image index out of bounds")

        # Store the URL of the image to be deleted from Azure Blob Storage
        image_to_delete_url = images[data.index]["url"]

        # Remove the image at the specified index from the list
        del images[data.index]

        # Attempt to delete the image from Azure Blob Storage
        try:
            await delete_image_from_azure_blob(image_to_delete_url)
        except Exception as azure_e:
            print(f"Warning: Failed to delete image from Azure Blob Storage: {azure_e}")
            # Optionally, you might want to log this more robustly or alert an admin
            # However, we proceed with database deletion to maintain app consistency.

        # Update the Barcode_Info record with the modified images array
        cursor.execute(
            "UPDATE Barcode_Info SET images = %s WHERE id = %s",
            (json.dumps(images), record_id)
        )
        conn.commit()
        return {"success": True, "images": images}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/shipped-shipments-filtered-lists")
async def get_admin_all_shipping_lists(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    customer_name: Optional[str] = None,
    barcode: Optional[str] = None,
):
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        sql_parts = [
            "SELECT",
            "    sl.id AS shipping_list_id,",
            "    sl.list_name,",
            "    sl.uploaded_by_email,",
            "    sl.upload_date,",
            "    bi.id AS barcode_id,",
            "    bi.barcode,",
            "    bi.date AS barcode_date,",
            "    bi.customer_name AS barcode_customer_name,",
            "    bi.expected_ship_date,",
            "    bi.bol_number,",
            "    bi.images,",
            "    bu.first_name,",
            "    bu.last_name,",
            "    bi.email AS barcode_email,",
            "    bi.department AS barcode_department",
            "FROM shipping_lists sl",
            "LEFT JOIN Barcode_Info bi ON sl.id = bi.shipping_list_id",
            "LEFT JOIN barcode_user bu ON bi.email = bu.email", # Assuming email from Barcode_Info links to barcode_user
            "WHERE 1=1"
        ]
        params = []

        if start_date:
            try:
                datetime.strptime(start_date, '%Y-%m-%d').date()
                sql_parts.append(" AND bi.expected_ship_date >= %s")
                params.append(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")
        if end_date:
            try:
                datetime.strptime(end_date, '%Y-%m-%d').date()
                sql_parts.append(" AND bi.expected_ship_date <= %s")
                params.append(end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD.")
        if customer_name:
            sql_parts.append(" AND bi.customer_name LIKE %s")
            params.append(f"%{customer_name}%")
        if barcode:
            sql_parts.append(" AND bi.barcode LIKE %s")
            params.append(f"%{barcode}%")

        sql_query = " ".join(sql_parts) + " ORDER BY sl.list_name, bi.date DESC"
        
        cursor.execute(sql_query, params)
        raw_records = cursor.fetchall()

        # Group records by shipping list
        filtered_shipping_lists = {}
        for rec in raw_records:
            list_id = rec['shipping_list_id']
            if list_id not in filtered_shipping_lists:
                filtered_shipping_lists[list_id] = {
                    'id': list_id,
                    'list_name': rec['list_name'],
                    'uploaded_by_email': rec['uploaded_by_email'],
                    'upload_date': rec['upload_date'],
                    'matching_barcode_records': []
                }
            
            # Prepare barcode record for frontend
            if rec['barcode_id'] is not None: # Only add if there's a barcode record associated
                barcode_record = {
                    'id': rec['barcode_id'],
                    'barcode': rec['barcode'],
                    'customer_name': rec['barcode_customer_name'],
                    'expected_ship_date': rec['expected_ship_date'].strftime('%Y-%m-%d') if rec['expected_ship_date'] else None,
                    'bol_number': rec['bol_number'],
                    'images': json.loads(rec.get('images', '[]') or '[]'),
                    'full_name': f"{rec.get('first_name', '')} {rec.get('last_name', '')}".strip(),
                    'email': rec['barcode_email'],
                    'date': rec['barcode_date'].isoformat(),
                    'department': rec['barcode_department']
                }
                filtered_shipping_lists[list_id]['matching_barcode_records'].append(barcode_record)
        
        return {"shipping_lists": list(filtered_shipping_lists.values())}

    except HTTPException:
        raise # Re-raise HTTPExceptions
    except Exception as e:
        print(f"Error in get_admin_all_shipping_lists: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

