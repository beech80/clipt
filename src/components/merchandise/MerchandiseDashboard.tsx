import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MerchandiseManager } from "./MerchandiseManager";
import { OrderHistory } from "./OrderHistory";
import { useAuth } from "@/contexts/AuthContext";

export function MerchandiseDashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <MerchandiseManager />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrderHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}