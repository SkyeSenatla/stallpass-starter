import {apiFetch} from "@app/lib/apiFetch";

export async function uploadDocument(_p: UploadState, fd : FormData) : Promise<UploadState> {
    const id = String(fd.get("id"));
    const body = new FormData();
    body .set("kind", String(fd.get("kind")));
    body .set("file", fd.get("file") as File);
    const res = await apiFetch(`/api/applications/${id}/documents`, {method: "POST", body});    
    if (!res.ok) {
        const err = await res.json();
        return {error: err.error};
    }
    return {error: null};
}

export async function removeDocument(_p: UploadState, fd : FormData) : Promise<UploadState> {
    const id = String(fd.get("id"));
    const res = await apiFetch(`/api/applications/${id}/documents`, {method: "DELETE"});
    if (!res.ok) {
        const err = await res.json();
        return {error: err.error};
    }
    return {error: null};
}
