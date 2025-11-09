export const Footer = () => {
  return (
    <footer className="border-t border-gray-800 bg-gray-900">
      <div className="container-custom py-8">
        <div className="text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Woong. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

