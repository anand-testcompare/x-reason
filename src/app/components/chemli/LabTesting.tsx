import { useCallback, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";

import { useReasonDemoDispatch, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";

export default function LabTesting() {
    const dispatch = useReasonDemoDispatch();
    const [value, setValue] = useState("");

    const onNext = useCallback(() => {
        const payload = {
            LabTesting: value || "Undefined",
        };
        dispatch({
            type: ReasonDemoActionTypes.SET_STATE,
            value: {
                event: {
                    type: "CONTINUE",
                    payload,
                },
            }
        });
    }, [dispatch, value]);

    return (<div className="space-y-4">
        <h1 className="text-2xl font-bold">Lab Testing Results</h1>
        <p>Enter the results of lab testing.</p>
        <div className="space-y-2">
            <Label htmlFor="lab-results">Lab Results</Label>
            <Textarea 
                id="lab-results"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="min-h-[150px]"
                placeholder="Enter lab testing results..."
            />
        </div>
        <Button onClick={onNext} variant="default">
            Next
        </Button>
    </div>);

}