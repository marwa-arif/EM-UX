import React from 'react'
import ErrorPage from '../pages/ErrorPage.jsx'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset() {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          type="error"
          onReset={() => { this.reset(); window.location.reload(); }}
        />
      );
    }
    return this.props.children;
  }
}
