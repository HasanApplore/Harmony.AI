import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
  phoneNumber?: string;
}

export default function TwoFactorAuthModal({
  isOpen,
  onClose,
  onVerify,
  phoneNumber = "+1******1234"
}: TwoFactorAuthModalProps) {
  const { toast } = useToast();
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setCode(Array(6).fill(""));
      // Focus first input when modal opens
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(0, 1); // Only take the first character
    setCode(newCode);

    // Move to next input if this one is filled
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current is empty
    if (e.key === "Backspace" && !code[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    
    // If pasted data is a 6-digit number, fill in all inputs
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      
      // Focus last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleResendCode = () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    // Simulate API call to resend code
    setTimeout(() => {
      setIsResending(false);
      setCountdown(60); // 60 second cooldown
      toast({
        title: "Verification code resent",
        description: `A new verification code has been sent to your mobile number.`
      });
    }, 1500);
  };

  const handleVerify = () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter all 6 digits of your verification code.",
        variant: "destructive"
      });
      return;
    }
    
    onVerify(fullCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-start">
            <span>Two-Factor Authentication</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="-mt-2 -mr-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-gray-600 mb-6">
          We've sent a verification code to your registered mobile number {phoneNumber}. Please enter it below to continue.
        </p>
        
        <div className="flex justify-between mb-6">
          {Array(6).fill(0).map((_, index) => (
            <Input
              key={index}
              type="text"
              maxLength={1}
              className="w-12 h-12 text-center text-xl font-bold border rounded-lg mx-1 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              value={code[index] || ""}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={(el) => (inputRefs.current[index] = el)}
            />
          ))}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button 
            variant="ghost" 
            disabled={isResending || countdown > 0}
            onClick={handleResendCode}
            className="mb-2 sm:mb-0"
          >
            {countdown > 0 ? `Resend Code (${countdown}s)` : "Resend Code"}
          </Button>
          <Button onClick={handleVerify}>Verify</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
