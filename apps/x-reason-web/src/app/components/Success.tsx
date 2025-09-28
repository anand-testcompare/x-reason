import { MouseEventHandler } from "react";

interface SuccessProps {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    message?: string;
}

export default function Success({ onClick, message }: SuccessProps) {
    return(
        <div className="p-4 border border-green-300 bg-green-50 rounded-md">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Success!</h2>
            {message && <p className="text-green-700 mb-3">{message}</p>}
            {onClick && (
                <button 
                    onClick={onClick}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Continue
                </button>
            )}
        </div>
    );
}