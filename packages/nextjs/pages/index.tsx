import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";

/** Homepage explains how the game works and offers enter contest button
 */

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />
      <div className="bg-base-300 grow px-5 md:px-10 xl:px-20">
        <h1 className="font-cubano text-4xl md:text-6xl xl:text-6xl text-center my-14 lg:my-20"> Vaults of Fortune</h1>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 items-center">
          <div className="flex justify-center">
            <Image src="/banner.png" width="1000" height="1000" alt="vaults of fortune banner" />
          </div>
          <div className="">
            <h2 className="font-cubano text-4xl text-center">How to Play</h2>
            <div className="rounded-xl py-10 pl-10 lg:pl-20 pr-5 lg:pr-10">
              <ol className="text-2xl list-decimal list-outside">
                <li className="mb-5">
                  Enter a contest to be airdropped 10,000 <span className="text-yellow-400">GODL</span> tokens
                </li>
                <li className="mb-5">
                  Compete for the highest return on investment over 3 rounds that last a maximum of 5 minutes each
                </li>
                <li className="mb-5">
                  During each round, allocate your <span className="text-yellow-400">GODL</span> into each vault as you
                  see fit
                </li>
                <li className="mb-5">
                  After allocating 100% of your <span className="text-yellow-400">GODL</span> into the vaults, put
                  pressure on the competition by clicking the {`"ready"`} button to expadite the round closing process
                </li>
                <li className="mb-5">
                  At the end of each round, the market contract sends or takes{" "}
                  <span className="text-yellow-400">GODL</span> from the vaults based on the random numbers generated by
                  VRF
                </li>
                <li className="mb-0">Highest net worth at the end of round 3 is the winner</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="flex justify-center my-10 lg:my-20">
          <Link
            className="bg-primary text-primary-content px-20 rounded-full text-3xl font-cubano py-8 capitalize"
            href="/contest"
          >
            Play Now
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
