import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { Leaderboard, Portfolio, Round, Vaults } from "~~/components/vaults-of-fortune/";

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />

      <div className="bg-base-300 py-10">
        {/* <h1 className="text-6xl text-center font-cubano my-10">Vaults Of Fortune</h1> */}
        <div className="rounded-xl grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div>
            <Leaderboard />
          </div>
          <div>
            <Portfolio />
          </div>
          <div>
            <Round />
          </div>
        </div>
      </div>

      <div className="p-5 xl:p-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-14">
          <Vaults />
        </div>
      </div>
    </>
  );
};

export default Home;
