export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white py-4 ">
      <div className="max-w-6xl mx-auto text-center text-sm">
        <p>© {new Date().getFullYear()} InfoQaz. Барлық құқықтар қорғалған.</p>
        <p className="mt-1">📞 Байланыс: infoqaz@gmail.com</p>
      </div>
    </footer>
  );
}
