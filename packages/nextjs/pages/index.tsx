import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { Leaderboard, Portfolio, Round, Vaults } from "~~/components/vaults-of-fortune/";

/**
 * Trying to collect the ROI results through events and keep them in state
 *
 * When all three vaults emit an roi event at the end of each round, trigger a modal that shows the results to users
 *
 * i.e. a useEffect that triggers when a round's array has length 3?
 */

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />

      <div className="bg-base-300 py-14 min-h-[468px] px-5 xl:px-10">
        {/* <h1 className="text-6xl text-center font-cubano my-10">Vaults Of Fortune</h1> */}
        <div className="rounded-xl grid grid-cols-1 xl:grid-cols-3 gap-14">
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
