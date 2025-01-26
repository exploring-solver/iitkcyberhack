import TransactionForm from "../components/TransactionForm";

const Home = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <TransactionForm forwarderAddress="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" />
    </div>
);

export default Home;
