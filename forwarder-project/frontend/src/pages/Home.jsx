import TransactionForm from "../components/TransactionForm";

const Home = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <TransactionForm forwarderAddress="0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" />
    </div>
);

export default Home;
