import { NavigationBar } from './NavigationBar';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <NavigationBar />
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
};
