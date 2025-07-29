import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

interface DatabaseErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * DatabaseError component displays a user-friendly error message when database connection issues occur
 */
export function DatabaseError({ 
  message = "We're having trouble connecting to our database", 
  onRetry 
}: DatabaseErrorProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Database Connection Error</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>{message}</p>
        <p className="text-sm">
          This could be due to server maintenance or configuration issues. Please try again later.
        </p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2 w-fit"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}