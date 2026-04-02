using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoMonitor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AtualizarCamposSensores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Umidade",
                table: "Leituras",
                newName: "UmidadeSht40");

            migrationBuilder.RenameColumn(
                name: "Temperatura",
                table: "Leituras",
                newName: "UmidadeAht20");

            migrationBuilder.RenameColumn(
                name: "LedLigado",
                table: "Leituras",
                newName: "AlertaAtivo");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DataHora",
                table: "Leituras",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<double>(
                name: "Co2",
                table: "Leituras",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "Luminosidade",
                table: "Leituras",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "PressaoBmp280",
                table: "Leituras",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "TempAht20",
                table: "Leituras",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "TempSht40",
                table: "Leituras",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "TensaoBateria",
                table: "Leituras",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Tvoc",
                table: "Leituras",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Co2",
                table: "Leituras");

            migrationBuilder.DropColumn(
                name: "Luminosidade",
                table: "Leituras");

            migrationBuilder.DropColumn(
                name: "PressaoBmp280",
                table: "Leituras");

            migrationBuilder.DropColumn(
                name: "TempAht20",
                table: "Leituras");

            migrationBuilder.DropColumn(
                name: "TempSht40",
                table: "Leituras");

            migrationBuilder.DropColumn(
                name: "TensaoBateria",
                table: "Leituras");

            migrationBuilder.DropColumn(
                name: "Tvoc",
                table: "Leituras");

            migrationBuilder.RenameColumn(
                name: "UmidadeSht40",
                table: "Leituras",
                newName: "Umidade");

            migrationBuilder.RenameColumn(
                name: "UmidadeAht20",
                table: "Leituras",
                newName: "Temperatura");

            migrationBuilder.RenameColumn(
                name: "AlertaAtivo",
                table: "Leituras",
                newName: "LedLigado");

            migrationBuilder.AlterColumn<DateTime>(
                name: "DataHora",
                table: "Leituras",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");
        }
    }
}
