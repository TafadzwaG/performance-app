import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

export default class PerformanceErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('Performance page error:', error, info.componentStack);
    }

    private handleReset = (): void => {
        this.setState({ error: null });
    };

    private handleReload = (): void => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    render() {
        if (this.state.error) {
            return (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="mx-auto my-10 max-w-xl rounded-lg border border-red-300 bg-red-50 p-6 text-red-800"
                >
                    <div className="flex items-center gap-2 text-base font-semibold">
                        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                        Something went wrong on this page
                    </div>
                    <p className="mt-2 text-sm">
                        An unexpected error interrupted this view. You can try again or reload the
                        page. If the problem keeps happening, contact support.
                    </p>
                    {import.meta.env.DEV ? (
                        <pre className="mt-3 max-h-40 overflow-auto rounded bg-white/60 p-2 text-xs">
                            {this.state.error.message}
                        </pre>
                    ) : null}
                    <div className="mt-4 flex gap-2">
                        <Button type="button" variant="outline" onClick={this.handleReset}>
                            Try again
                        </Button>
                        <Button type="button" onClick={this.handleReload}>
                            Reload page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
