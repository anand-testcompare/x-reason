import { useCallback, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useReasonDemoDispatch, ReasonDemoActionTypes } from "@/app/context/ReasoningDemoContext";

export default function RegisterUser() {
    const dispatch = useReasonDemoDispatch();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const onNext = useCallback(() => {
        const payload = {
            RegisterUser: {
                firstName,
                lastName,
                email,
                registeredOn: Date.now()
            },
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
    }, [dispatch, firstName, lastName, email]);

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">User Registration</h1>
            <div className="space-y-2">
                <Label htmlFor="first-name-input">
                    First Name <span className="text-red-500">(required)</span>
                </Label>
                <Input
                    id="first-name-input"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="last-name-input">
                    Last Name <span className="text-red-500">(required)</span>
                </Label>
                <Input
                    id="last-name-input"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email-input">
                    Email <span className="text-red-500">(required)</span>
                </Label>
                <Input
                    id="email-input"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <Button onClick={onNext} variant="default">
                Register
            </Button>
        </div>
    );
}
