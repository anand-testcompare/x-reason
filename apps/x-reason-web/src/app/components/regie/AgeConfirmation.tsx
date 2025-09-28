import { useCallback, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";

import { useReasonDemoDispatch, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";

export default function AgeConfirmation() {
    const dispatch = useReasonDemoDispatch();
    const [checked, setChecked] = useState(false);

    function onChange() {
        setChecked(!checked);
    }

    const onNext = useCallback(() => {
        const payload = {
            AgeConfirmation: { confirmed: checked, confirmedOn: Date.now() },
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
    }, [dispatch, checked]);

    return (<div className="space-y-4">
        <h1 className="text-2xl font-bold">Confirm Your Age</h1>
        <div className="flex items-center space-x-2">
            <Checkbox id="age" checked={checked} onCheckedChange={(checked) => setChecked(checked as boolean)} />
            <Label htmlFor="age">I am at least 18 years of age</Label>
        </div>
        <Button onClick={onNext} variant="default">
            Next
        </Button>
    </div>);

}