import { Link } from "react-router-dom";

interface Props {
  type: "fabrics" | "luxury";
}

export default function NavDropdown({ type }: Props) {
  return (
    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-border shadow-lg rounded-md py-2 z-50">

      {type === "fabrics" && (
        <>
          <Link to="/fabrics/explore" className="block px-4 py-2 text-sm hover:bg-secondary/50">
            Explore Fabrics
          </Link>
          <Link to="/fabrics/shop" className="block px-4 py-2 text-sm hover:bg-secondary/50">
            Shop All Fabrics
          </Link>
        </>
      )}

      {type === "luxury" && (
        <>
          <Link to="/luxury" className="block px-4 py-2 text-sm hover:bg-secondary/50">
            Explore Luxury
          </Link>
          <Link to="/luxury" className="block px-4 py-2 text-sm hover:bg-secondary/50">
            Shop All Luxury
          </Link>
        </>
      )}

    </div>
  );
}