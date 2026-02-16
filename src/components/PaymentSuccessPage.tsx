
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';
import { CheckCircleIcon } from 'lucide-react';
import gsap from 'gsap';

interface PaymentSuccessPageProps {
    onGoHome: () => void;
}

const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onGoHome }) => {
    useEffect(() => {
        // Animation
        gsap.fromTo('.success-card',
            { scale: 0.9, opacity: 0, y: 20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
        );
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <Card className="success-card w-full max-w-md bg-card/50 backdrop-blur-xl border-green-500/20 shadow-[0_0_50px_-10px_rgba(34,197,94,0.3)]">
                <CardHeader>
                    <div className="mx-auto mb-4 p-4 bg-green-500/10 rounded-full border border-green-500/20">
                        <CheckCircleIcon className="w-12 h-12 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">Payment Successful!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                        Thank you for your purchase. Your plan has been upgraded successfully.
                        You now have access to premium features.
                    </p>
                    <div className="pt-4">
                        <Button
                            onClick={onGoHome}
                            className="w-full h-11 text-base font-semibold bg-green-600 hover:bg-green-700 shadow-green-500/20"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentSuccessPage;
