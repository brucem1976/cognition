import React, { useState } from 'react';
import { CognitoService } from '../../auth/CognitoService';

interface MFAVerificationProps {
    session: string;
    username: string;
    challengeName: string;
    onSuccess: (result: any) => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ session, username, challengeName, onSuccess }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const result = await CognitoService.respondToAuthChallenge(challengeName, code, session, username);
            if (result.accessToken) {
                onSuccess(result);
            } else {
                setError('Verification failed or additional steps required.');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-center">MFA Verification</h3>
            <div className="text-sm text-gray-600 text-center">
                Enter the code sent to your {challengeName === 'SMS_MFA' ? 'phone' : 'device'}
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <input
                type="text"
                placeholder="Confirmation Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="p-2 border rounded"
                required
            />
            <button
                type="submit"
                className="p-2 text-white bg-green-600 rounded hover:bg-green-700"
            >
                Verify
            </button>
        </form>
    );
};

export default MFAVerification;
