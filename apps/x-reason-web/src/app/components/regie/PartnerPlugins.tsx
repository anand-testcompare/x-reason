import { useCallback, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";

import { useReasonDemoDispatch, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";

export default function PartnerPlugins() {
    const dispatch = useReasonDemoDispatch();
    const [checked, setChecked] = useState(false);

    function _onChange() {
        setChecked(!checked);
    }

    const onNext = useCallback(() => {
        const payload = {
            PartnerPlugins: { newsletterConfirmed: checked, confirmedOn: Date.now() },
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
        <h1 className="text-2xl font-bold">Partner Plugins</h1>
        <div className="flex items-center space-x-2">
            <Checkbox id="newsletter" checked={checked} onCheckedChange={(checked) => setChecked(checked as boolean)} />
            <Label htmlFor="newsletter">Sign up for the X-Reason Newsletter</Label>
        </div>
        <Button onClick={onNext} variant="default">
            Next
        </Button>
    </div>);

}