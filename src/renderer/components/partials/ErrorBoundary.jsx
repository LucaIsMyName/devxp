import React, { Component } from "react";

class ErrorBoundary extends Component {
   state = {
    hasError: false,
    error: null,
  };
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
            <details className="mt-2 text-sm text-red-700">
              <summary>Error details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;