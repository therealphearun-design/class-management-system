import React from 'react';

import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      // Sentry.captureException(error);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineExclamationCircle className="w-10 h-10 text-red-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-500 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="primary"
                icon={HiOutlineRefresh}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => window.location.href = '/'}
              >
                Go to Dashboard
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                  Error Details
                </summary>
                <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-60">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
