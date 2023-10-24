using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Dominio
{
    public class ItemFila
    {
        public List<StatusFila> statusFilas = new();
        public ItemFila()
        {
            Medium = new Medium();
            statusFilas.Add(new StatusFila() { Id = 0, Nome = "Aguardando" });
            statusFilas.Add(new StatusFila() { Id = 1, Nome = "Em Andamento" });
            statusFilas.Add(new StatusFila() { Id = 2, Nome = "Finalizado" });
        }

        public int Id { get; set; }
        public int Numero { get; set; }
        public string Nome { get; set; }
        public string Tel { get; set; }
        public string Email { get; set; }
        public StatusFila StatusFila { get; set; }
        public Medium Medium { get; set; }

        public StatusFila GetStatusByName(string name)
        {
            return statusFilas.Where(f => f.Nome == name).FirstOrDefault();
        }
        public StatusFila GetStatusById(int id)
        {
            return statusFilas.Where(f => f.Id == id).FirstOrDefault();
        }

        public List<StatusFila> GetAllStatus()
        {
            return statusFilas;
        }

        private bool IsValidEmail(string email)
        {
            var trimmedEmail = email.Trim();

            if (trimmedEmail.EndsWith("."))
            {
                return false;
            }
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == trimmedEmail;
            }
            catch
            {
                return false;
            }
        }

        public bool IsValid()
        {
            var boolList = new List<bool>();

            if (!string.IsNullOrEmpty(Nome))
                boolList.Add(true);

            if (!string.IsNullOrEmpty(Email))
                boolList.Add(IsValidEmail(Email));

            return !boolList.Contains(false);
        }
    }

    /*
     1 - Aguardando
     2 - Em Andamento
     3 - Finalizado
     */
    public class StatusFila
    {
        public int Id { get; set; }
        public string Nome { get; set; }
    }
}
