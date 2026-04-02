import os
import base64
from fastapi import HTTPException
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient
from azure.storage.blob import PublicAccess # Import PublicAccess if you intend to use it

load_dotenv() # Load environment variables from .env file

# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_STORAGE_CONTAINER_NAME = os.getenv('AZURE_STORAGE_CONTAINER_NAME')

def get_blob_service_client():
    if not AZURE_STORAGE_CONNECTION_STRING:
        raise HTTPException(status_code=500, detail="Azure Storage Connection String not configured.")
    try:
        return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create BlobServiceClient: {e}")

async def upload_image_to_azure_blob(image_data_base64: str, barcode: str, file_name: str):
    if not AZURE_STORAGE_CONTAINER_NAME:
        raise HTTPException(status_code=500, detail="Azure Storage Container Name not configured.")

    blob_service_client = get_blob_service_client()
    container_client = blob_service_client.get_container_client(AZURE_STORAGE_CONTAINER_NAME)
    
    try:
        # Ensure the container exists
        if not container_client.exists():
            container_client.create_container(public_access=PublicAccess.Container)

        image_bytes = base64.b64decode(image_data_base64)
        blob_name = f"{barcode}/{file_name}" # Organize blobs by barcode
        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(image_bytes, overwrite=True)

        # Construct the public URL for the blob
        # Assuming the container is publicly accessible for direct URL access
        return blob_client.url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image to Azure Blob Storage: {e}")

async def delete_image_from_azure_blob(image_url: str):
    if not AZURE_STORAGE_CONTAINER_NAME:
        raise HTTPException(status_code=500, detail="Azure Storage Container Name not configured.")
    
    blob_service_client = get_blob_service_client()
    container_client = blob_service_client.get_container_client(AZURE_STORAGE_CONTAINER_NAME)
    
    try:
        # Extract blob name from URL
        # The URL format is typically: https://<account_name>.blob.core.windows.net/<container_name>/<blob_name>
        blob_name_with_prefix = image_url.split(f"/{AZURE_STORAGE_CONTAINER_NAME}/")[-1]
        
        blob_client = container_client.get_blob_client(blob_name_with_prefix)
        blob_client.delete_blob()
        return {"success": True, "message": f"Blob {blob_name_with_prefix} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image from Azure Blob Storage: {e}")
