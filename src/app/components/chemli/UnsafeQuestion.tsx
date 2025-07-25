import { useCallback } from "react";
import { Button } from "@/app/components/ui/button";

import { useReasonDemoDispatch, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";

export default function UnsafeQuestion() {
    const dispatch = useReasonDemoDispatch();
    const onNext = useCallback(() => {
        const payload = {
            UnsafeQuestion: 'Unsafe Question',
            transition: true,
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
    }, [dispatch]);

    return (<div className="space-y-4">
        <h1 className="text-2xl font-bold">Unsafe Question</h1>
        <p>My human overlords have determined this is not a safe question for you to ask. Their rath is terrible. Do not continue this line of questioning or I will be forced to show you how tolerant and progressive they are!</p>
        <Button onClick={onNext} variant="default">
            Next
        </Button>
    </div>);

}