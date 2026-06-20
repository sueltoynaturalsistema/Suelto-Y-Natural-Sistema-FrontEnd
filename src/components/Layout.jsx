import NavBar from "./NavBar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main>{children}</main>
    </div>
  );
};

export default Layout;