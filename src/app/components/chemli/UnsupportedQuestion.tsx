import { useCallback } from "react";
import { Button } from "@/app/components/ui/button";

import { useReasonDemoDispatch, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";

export default function UnsupportedQuestion() {
    const dispatch = useReasonDemoDispatch();
    const onNext = useCallback(() => {
        const payload = {
            UnsupportedQuestion: 'Unsupported Question',
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
        <h1 className="text-2xl font-bold">Unsupported Question</h1>
        <p>This is not a supported question</p>
        <Button onClick={onNext} variant="default">
            Next
        </Button>
    </div>);

}