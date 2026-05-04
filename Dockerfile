FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY VaxWise.API/VaxWise.API.csproj VaxWise.API/
RUN dotnet restore VaxWise.API/VaxWise.API.csproj
COPY VaxWise.API/ VaxWise.API/
RUN dotnet publish VaxWise.API/VaxWise.API.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "VaxWise.API.dll"]
