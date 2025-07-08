import { useParams } from "react-router";

const Store: React.FC = (): React.ReactElement => {
    const { store_id } = useParams();
  return (
    <div>Store ID: {store_id}</div>
  )
}

export default Store;