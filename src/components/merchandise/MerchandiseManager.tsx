import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Package, DollarSign, ShoppingCart } from "lucide-react";

interface MerchandiseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  category: string;
  is_active: boolean;
}

export function MerchandiseManager() {
  const queryClient = useQueryClient();
  const [newProduct, setNewProduct] = useState<Partial<MerchandiseProduct>>({
    name: "",
    description: "",
    price: 0,
    stock_quantity: 0,
    category: "",
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['merchandise-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchandise_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (product: Partial<MerchandiseProduct>) => {
      const { data, error } = await supabase
        .from('merchandise_products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise-products'] });
      toast.success("Product added successfully!");
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        stock_quantity: 0,
        category: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to add product: " + error.message);
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('merchandise_products')
        .update({ stock_quantity: quantity })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise-products'] });
      toast.success("Stock updated successfully!");
    },
  });

  if (isLoading) {
    return <div>Loading merchandise...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Add New Product
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <Input
            placeholder="Category"
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="Stock Quantity"
            value={newProduct.stock_quantity}
            onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
          />
          <Input
            className="md:col-span-2"
            placeholder="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />
        </div>
        
        <Button 
          className="mt-4"
          onClick={() => createMutation.mutate(newProduct)}
        >
          Add Product
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((product) => (
          <Card key={product.id} className="p-4">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center text-green-600">
                <DollarSign className="h-4 w-4" />
                {product.price.toFixed(2)}
              </span>
              <span className="flex items-center">
                <ShoppingCart className="h-4 w-4 mr-1" />
                {product.stock_quantity} in stock
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStockMutation.mutate({
                  id: product.id,
                  quantity: product.stock_quantity + 1
                })}
              >
                + Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStockMutation.mutate({
                  id: product.id,
                  quantity: Math.max(0, product.stock_quantity - 1)
                })}
                disabled={product.stock_quantity <= 0}
              >
                - Stock
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}