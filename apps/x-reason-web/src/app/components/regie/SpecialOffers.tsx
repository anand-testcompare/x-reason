import { useCallback, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { useReasonDemoDispatch, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";

export default function SpecialOffers() {
    const dispatch = useReasonDemoDispatch();
    const [selectedOffer, setSelectedOffer] = useState("Prepay 6 months and get 10% off");

    const onOfferChange = useCallback((value: string) => {
        setSelectedOffer(value);
    }, []);

    const onNext = useCallback(() => {
        const payload = {
            SpecialOffers: { offer: selectedOffer, selectedOn: Date.now() },
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
    }, [dispatch, selectedOffer]);

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Select a Special Offer</h1>
            <div className="space-y-2">
                <Label>Choose an offer</Label>
                <RadioGroup value={selectedOffer} onValueChange={onOfferChange}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Prepay 6 months and get 10% off" id="offer1" />
                        <Label htmlFor="offer1">Prepay 6 months and get 10% off</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Prepay one year and get 10% off" id="offer2" />
                        <Label htmlFor="offer2">Prepay one year and get 10% off</Label>
                    </div>
                </RadioGroup>
            </div>
            <Button onClick={onNext} variant="default">
                Next
            </Button>
        </div>
    );
}
