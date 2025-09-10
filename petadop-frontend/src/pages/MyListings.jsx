// src/pages/MyListings.jsx
import React from "react";
import { usePetsStore } from "../store/pets.js";
import { useAuthStore } from "../store/auth.js";
import PetCard from "../components/PetCard.jsx";
import Button from "../components/ui/Button.jsx";

export default function MyListings() {
  const { user } = useAuthStore();
  const {
    myPets,
    myPetsTotal,
    myPetsPage,
    myPetsLimit,
    myPetsLoading,
    fetchMyPets,
  } = usePetsStore();

  React.useEffect(() => {
    fetchMyPets({ page: 1 });
  }, [fetchMyPets]);

  const next = () => {
    const nextPage = myPetsPage + 1;
    if (nextPage <= Math.ceil(myPetsTotal / myPetsLimit))
      fetchMyPets({ page: nextPage });
  };
  const prev = () => {
    const prevPage = Math.max(1, myPetsPage - 1);
    if (prevPage !== myPetsPage) fetchMyPets({ page: prevPage });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Listings</h1>
          <p className="text-sm text-mutedForeground">
            {user?.fullname ? user.fullname : "You"} — {myPetsTotal} total
          </p>
        </div>
      </div>

      {myPetsLoading ? (
        <div className="grid min-h-[30vh] place-items-center text-sm text-mutedForeground">
          Loading your pets…
        </div>
      ) : myPets.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-8 text-center">
          <p className="mb-3 text-sm text-mutedForeground">
            You haven’t listed any pets yet.
          </p>
          <Button as="a" href="/new">
            List a Pet
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myPets.map((p) => (
              <PetCard key={p.id || p._id} pet={p} />
            ))}
          </div>

          {/* simple pager */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="outline" onClick={prev} disabled={myPetsPage <= 1}>
              Prev
            </Button>
            <span className="text-sm text-mutedForeground">
              Page {myPetsPage} of{" "}
              {Math.max(1, Math.ceil(myPetsTotal / myPetsLimit))}
            </span>
            <Button
              variant="outline"
              onClick={next}
              disabled={myPetsPage >= Math.ceil(myPetsTotal / myPetsLimit)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
