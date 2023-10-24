namespace Dominio
{
    public class Fila
    {
        public Fila()
        {
            ItemsFila = new List<ItemFila>();
        }
        public int Id { get; set; }
        public string Descricao { get; set; }
        public string DataHora { get; set; }
        public List<ItemFila> ItemsFila { get; set; }
    }

}