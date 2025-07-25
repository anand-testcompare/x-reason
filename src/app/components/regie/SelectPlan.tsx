import { useCallback, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { useReasonDemoDispatch, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";

export default function SelectPlan() {
    const dispatch = useReasonDemoDispatch();
    const [selectedPlan, setSelectedPlan] = useState("Basic");

    const onPlanChange = useCallback((value: string) => {
        setSelectedPlan(value);
    }, []);

    const onNext = useCallback(() => {
        const payload = {
            SelectPlan: { plan: selectedPlan, selectedOn: Date.now() },
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
    }, [dispatch, selectedPlan]);

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Select Your Plan</h1>
            <div className="space-y-2">
                <Label>Choose a plan</Label>
                <RadioGroup value={selectedPlan} onValueChange={onPlanChange}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Basic" id="r1" />
                        <Label htmlFor="r1">Basic, free for a single user</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Premium" id="r2" />
                        <Label htmlFor="r2">Premium, up to 10 users $19.99/mo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pro" id="r3" />
                        <Label htmlFor="r3">Pro, unlimited users $100/mo</Label>
                    </div>
                </RadioGroup>
            </div>
            <Button onClick={onNext} variant="default">
                Next
            </Button>
        </div>
    );
}
