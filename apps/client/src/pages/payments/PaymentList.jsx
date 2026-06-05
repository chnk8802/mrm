import { Link } from "react-router-dom";

export default function PaymentList() {
    return <div>
        <p>Payment List</p>
        <p>
            <Link to="payments/new">Payment Create</Link>
        </p>
        <p>
            <Link to={`${"some_id"}`}>Payment Details</Link>
        </p>
    </div>;
}