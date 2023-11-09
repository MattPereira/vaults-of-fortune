import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { Vaults } from "~~/components/Vaults";

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />
      <div className="px-10">
        <h1 className="text-center my-14 text-6xl font-cubano">Vaults Of Fortune</h1>

        <div className="bg-base-300 h-96 mb-14 rounded-xl grid grid-cols-2 p-5">
          <div>
            <h3 className="text-center text-2xl font-cubano">Leaderboard</h3>
          </div>

          <div>
            <h3 className="text-center text-2xl font-cubano">Round Info</h3>
            <p>Time remaining</p>
            <p>open/calculating/closed state</p>
            <p>Round number</p>

            <div className="flex justify-center">
              <span className="countdown font-mono text-6xl">
                <span style={{ "--value": 60 } as React.CSSProperties}></span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Vaults />
        </div>
      </div>
    </>
  );
};

export default Home;
