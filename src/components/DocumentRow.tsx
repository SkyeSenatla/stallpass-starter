"use client"
import {useActionState, useEffect, useState} from 'react';
import {uploadDocument, removeDocument} from "@app/applications/actions";


export function DocumentRow({appId, req, doc}: {document: any, applicationId: string}) {
const [state, action, pending] = useActionState(uploadDocument, removeDocument);
const [clientError, setClientError] = useState<string | null>(null);

useEffect(() => {
  if (state?.error) {
    toast.error(state.error);
  }
  
  const error = clientError || state?.error;
  return (
    <li>
        <form
        action={action}
        onSubmit={(e) => {
            const f = new FormData(e.currentTarget);
            const file = f.get("file") as File;
            const error = checkFile(file); 
        }}
        >   
       input type="hidden" name="applicationId" value={appId} />
       input type="hidden" name="documentId" value={doc.id} />
       <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" />
       <button type="submit" disabled={pending}>Upload</button>
       {error && <p className="text-red-500">{error}</p>}       

        </form>
