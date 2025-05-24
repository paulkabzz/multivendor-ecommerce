import type { IShoppingCard } from "@/src/utils/types";

export const ShoppingCard: React.FC<IShoppingCard> = ({ name, price, img_url}) => {
  return (
   <>
        <div className="w-[200px] h-[350px] flex flex-col gap-[.75rem] pb-[.5rem]">
            <div className="w-full h-[250px] relative overflow-hidden">
                <img src={img_url} alt={name} className="w-full h-full block object-cover"/>
            </div>
            <div>

            </div>
        </div>
   </>
  );
};
