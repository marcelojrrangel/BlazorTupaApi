using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Dominio
{
    public class Evento
    {
        public required string Descricao { get; set; }
        public DateTime Data { get; set; } = DateTime.MinValue;
        public string Mes
        {
            get
            {
                return Data.ToString("MMMM", System.Globalization.CultureInfo.GetCultureInfo("pt-BR"));                
            }
        }
        public required string Detalhe { get; set; }
        public override string ToString()
        {
            return "Evento: " + Descricao + " Localidade: " + Data + " Detalhe: " + Detalhe;
        }
    }
}
