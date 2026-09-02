# XML-format for biografier

En digters biografier ligger i `fdirs/<id>/bio.xml`. Roden `<bio>` indeholder
ét `<biographies>`-element med et eller flere `<biography>`-elementer:

```xml
<bio>
  <biographies>
    <biography>
      <head>
        <source href="https://example.com/opslag">Kildeangivelse</source>
      </head>
      <body>Biografiens tekst.</body>
    </biography>
  </biographies>
</bio>
```

Hver biografi har sit eget `<head>` og `<body>`. Kilder i `<head>` gælder kun
for den pågældende biografi. Flere selvstændige kildetekster skal derfor ligge
i hvert sit `<biography>`-element og må ikke adskilles med en vandret streg i
samme `<body>`.

En ældre redaktionel tekst, som skal bevares uden at blive vist på sitet,
markeres med `hidden="true"` på `<biography>`. Skjulte biografier bevarer deres
normale `<head>` og `<body>` og må ikke gemmes i XML-kommentarer.
