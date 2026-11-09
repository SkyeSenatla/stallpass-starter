import { describe } from "zod/v4/core";
import {resolveStep} from "./applicationSteps";
import checkFile from "./checkFile";
import type {Application} from "@lib/api/types";

const base = {
    id: "a1", status:"draft"
    requiredDocuments: [
        {kind: "proofOfIdentity", name: "Proof of Identity", required: true},
        {kind: "proofOfAddress", name: "Proof of Address", required: true},     

        describe("resolveStep", () => {
            it ("submited is read-only", () => {
            it ("no steps goes to step 1", () => {
            });

        describe("checkFile", () => {
            it ("rejects non-pdf or image files", () => {
            it ("rejects files larger than 2MB", () => {
            it ("accepts valid files", () => {
            });
        });
    });
}