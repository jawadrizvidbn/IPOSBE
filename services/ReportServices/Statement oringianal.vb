' Start Tbl StockValue and Zero RAted & STAndard Totals 
ReportDateTo = format(DTPTo.Value + 1, "YYYYMMDD")
   ' MsgBox "Date is : " & ReportDateTo
    Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    Adodc4.RecordSource = "select * from tblstockvalues where tranday='" & Mid$(ReportDateTo, 7, 2) & _
    "' and tranmonth='" & Mid$(ReportDateTo, 5, 2) & "'" & " and tranyear='" & Mid$(ReportDateTo, 1, 4) & "'"
    Adodc4.Refresh
        If Adodc4.Recordset.RecordCount = 0 Then
            ReportDateTo = format(DTPTo.Value + 2, "YYYYMMDD")
            Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
            Adodc4.RecordSource = "select * from tblstockvalues where tranday='" & Mid$(ReportDateTo, 7, 2) & _
            "' and tranmonth='" & Mid$(ReportDateTo, 5, 2) & "'" & " and tranyear='" & Mid$(ReportDateTo, 1, 4) & "'"
            Adodc4.Refresh
        End If
    
        If Adodc4.Recordset.RecordCount <> 0 Then
        texclcostValue = Adodc4.Recordset!texclcost
        tInclcostValue = Adodc4.Recordset!tinclcost
        texclselling = Adodc4.Recordset!texclselling
        tinclselling = Adodc4.Recordset!tinclselling
           
        frmFinancialSummary.StkExclCost = format(texclcostValue, "0.00")
        frmFinancialSummary.StkInclCost = format(tInclcostValue, "0.00")
        frmFinancialSummary.StkExclSelling = format(texclselling, "0.00")
        frmFinancialSummary.StkInclSelling = format(tinclselling, "0.00")
        frmFinancialSummary.StkProjecctedProfit = format(tinclselling - texclcostValue, "0.00")
        
        frmFinancialSummary.stkNonVATCost = Adodc4.Recordset!GPP
        frmFinancialSummary.StkNonVATSelling = Adodc4.Recordset!BLANK2
        
        
        frmFinancialSummary.StkVATableCost = Adodc4.Recordset!BLANK3
        frmFinancialSummary.StkVATableSelling = Adodc4.Recordset!BLANK5
        End If
' End Tbl StockValue and Zero RAted & STAndard Totals
PB1.Value = PB1.Value + 1
' Current Debitors 
    ReportDateTo = format(DTPTo.Value + 1, "YYYYMMDD")
    Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    Adodc4.RecordSource = "select * from tbldebtorsvalue where tranday='" & Mid$(ReportDateTo, 7, 2) & _
    "' and tranmonth='" & Mid$(ReportDateTo, 5, 2) & "'" & " and tranyear='" & Mid$(ReportDateTo, 1, 4) & "'"
    Adodc4.Refresh
      If Adodc4.Recordset.RecordCount = 0 Then
        ReportDateTo = format(DTPTo.Value + 2, "YYYYMMDD")
        Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
        Adodc4.RecordSource = "select * from tbldebtorsvalue where tranday='" & Mid$(ReportDateTo, 7, 2) & _
        "' and tranmonth='" & Mid$(ReportDateTo, 5, 2) & "'" & " and tranyear='" & Mid$(ReportDateTo, 1, 4) & "'"
        Adodc4.Refresh
      End If
                If Adodc4.Recordset.RecordCount <> 0 Then
                frmFinancialSummary.DrCurrent = format(Adodc4.Recordset!current, "0.00")
                frmFinancialSummary.Dr30Days = format(Adodc4.Recordset![30days], "0.00")
                frmFinancialSummary.Dr60Days = format(Adodc4.Recordset![60days], "0.00")
                frmFinancialSummary.Dr90Days = format(Adodc4.Recordset![90days], "0.00")
                frmFinancialSummary.Dr120Days = format(Adodc4.Recordset![120days], "0.00")
                frmFinancialSummary.Dr150Days = format(Adodc4.Recordset![150days], "0.00")
                frmFinancialSummary.Dr180Days = format(Adodc4.Recordset![180days], "0.00")
                frmFinancialSummary.DrTotals = format(Adodc4.Recordset!TotalBalance, "0.00")
                frmFinancialSummary.lblNoOfDebtors = format(Adodc4.Recordset!totalnoofdebtors, "0.00")
                frmFinancialSummary.lblDebtorsWithBalance = format(Adodc4.Recordset!debtorwithbalance, "0.00")
                End If
                ' End Current Debitors 
PB1.Value = PB1.Value + 1

' Current Creditors 
     ReportDateTo = format(DTPTo.Value + 1, "YYYYMMDD")
    Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    Adodc4.RecordSource = "select * from tblcreditorsvalue where tranday='" & Mid$(ReportDateTo, 7, 2) & _
    "' and tranmonth='" & Mid$(ReportDateTo, 5, 2) & "'" & " and tranyear='" & Mid$(ReportDateTo, 1, 4) & "'"
    Adodc4.Refresh
        If Adodc4.Recordset.RecordCount = 0 Then
            ReportDateTo = format(DTPTo.Value + 2, "YYYYMMDD")
            Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
            Adodc4.RecordSource = "select * from tblcreditorsvalue where tranday='" & Mid$(ReportDateTo, 7, 2) & _
            "' and tranmonth='" & Mid$(ReportDateTo, 5, 2) & "'" & " and tranyear='" & Mid$(ReportDateTo, 1, 4) & "'"
            Adodc4.Refresh
        End If
                If Adodc4.Recordset.RecordCount <> 0 Then
                frmFinancialSummary.CrCurrent = format(Adodc4.Recordset!current, "0.00")
                frmFinancialSummary.CR30Days = format(Adodc4.Recordset![30days], "0.00")
                frmFinancialSummary.Cr60Days = format(Adodc4.Recordset![60days], "0.00")
                frmFinancialSummary.Cr90Days = format(Adodc4.Recordset![90days], "0.00")
                frmFinancialSummary.Cr120Days = format(Adodc4.Recordset![120days], "0.00")
                frmFinancialSummary.Cr150Days = format(Adodc4.Recordset![150days], "0.00")
                frmFinancialSummary.Cr180Days = format(Adodc4.Recordset![180days], "0.00")
                frmFinancialSummary.CrTotals = format(Adodc4.Recordset!TotalBalance, "0.00")
                frmFinancialSummary.lblNoOfCreditors = format(Adodc4.Recordset!totalnoofcreditors, "0.00")
                frmFinancialSummary.lblCreditorsWithBalance = format(Adodc4.Recordset!creditorswithbalance, "0.00")
                End If
   PB1.Value = PB1.Value + 1
    'Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    'Adodc4.RecordSource = "select * from tbldebtorsvalue where tranday='" & format(DTPTo.Value, "DD") & "' and tranmonth='" & format(DTPTo.Value, "MM") & "'" & _
    '" and tranyear='" & format(DTPTo.Value, "YYYY") & "'"
    'Adodc4.Refresh
    
    'If Adodc4.Recordset.RecordCount <> 0 Then
    'frmFinancialSummary.lblNoOfDebtors = Adodc4.Recordset!totalnoofdebtors
    'frmFinancialSummary.lblDebtorsWithBalance = Adodc4.Recordset!debtorwithbalance
    'frmFinancialSummary.DrTotals = format(Adodc4.Recordset!TotalBalance, "0.00")
    'frmFinancialSummary.DrCurrent = format(Adodc4.Recordset!current, "0.00")
    'frmFinancialSummary.Dr30Days = format(Adodc4.Recordset![30days], "0.00")
    'frmFinancialSummary.Dr60Days = format(Adodc4.Recordset![60days], "0.00")
    'frmFinancialSummary.Dr90Days = format(Adodc4.Recordset![90days], "0.00")
    'frmFinancialSummary.Dr120Days = format(Adodc4.Recordset![120days], "0.00")
    'frmFinancialSummary.Dr150Days = format(Adodc4.Recordset![150days], "0.00")
    'frmFinancialSummary.Dr180Days = format(Adodc4.Recordset![180days], "0.00")
    'End If
    
    
    'Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    'Adodc4.RecordSource = "select * from tblcreditorsvalue where tranday='" & format(DTPTo.Value, "DD") & "' and tranmonth='" & format(DTPTo.Value, "MM") & "'" & _
    '" and tranyear='" & format(DTPTo.Value, "YYYY") & "'"
    'Adodc4.Refresh
    
   ' If Adodc4.Recordset.RecordCount <> 0 Then
   ' frmFinancialSummary.lblNoOfCreditors = Adodc4.Recordset!totalnoofcreditors
   ' frmFinancialSummary.lblCreditorsWithBalance = Adodc4.Recordset!creditorswithbalance
   ' frmFinancialSummary.CrTotals = format(Adodc4.Recordset!TotalBalance, "0.00")
   ' frmFinancialSummary.CrCurrent = format(Adodc4.Recordset!current, "0.00")
   ' frmFinancialSummary.CR30Days = format(Adodc4.Recordset![30days], "0.00")
   ' frmFinancialSummary.Cr60Days = format(Adodc4.Recordset![60days], "0.00")
   ' frmFinancialSummary.Cr90Days = format(Adodc4.Recordset![90days], "0.00")
   ' frmFinancialSummary.Cr120Days = format(Adodc4.Recordset![120days], "0.00")
   ' frmFinancialSummary.Cr150Days = format(Adodc4.Recordset![150days], "0.00")
   ' frmFinancialSummary.Cr180Days = format(Adodc4.Recordset![180days], "0.00")
   ' End If
'//////////////////////////////////////// SALES FIGURES '//////////////////////
    
    
    If CnHost.State Then
        CnHost.Close
    End If
   CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
    CnHost.Execute "delete from tmpdata_current_tran"
    AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldatacurrent_tran where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                'MsgBox DTPFrom
                CnHost.Execute "insert into " & DbnameB & ".tmpdata_current_tran select * from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & _
                format(DTPFrom.Value, "YYYY-MM-DD") & " " & format(DTPTIMEFROM.Value, "hh:mm:ss") & "'"
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                CnHost.Execute "insert into " & DbnameB & ".tmpdata_current_tran select * from " & DbnameA & "." & AdoTblList.Recordset!Name & _
                "  where " & DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD") & " " & _
                format(DTPTIMETO.Value, "hh:mm:ss") & "'"
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                CnHost.Execute "insert into " & DbnameB & ".tmpdata_current_tran select * from " & DbnameA & "." & AdoTblList.Recordset!Name & _
                " where " & DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD") & " " & _
                format(DTPTIMEFROM.Value, "hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD") & " " & format(DTPTIMETO.Value, "hh:mm:ss") & "'"
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                CnHost.Execute "insert into " & DbnameB & ".tmpdata_current_tran select * from " & DbnameA & "." & AdoTblList.Recordset!Name
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile30
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile30:
    
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "ipos"
    AdoFinancial.RecordSource = "select sum(linetotal) as TTotal,paymenttype from tmpdata_current_tran group by paymenttype"
    AdoFinancial.Refresh
    While Not AdoFinancial.Recordset.EOF
        'MsgBox "Data : " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
        If AdoFinancial.Recordset!paymenttype = "Cash" Then
            'MsgBox "Data : Cash " & AdoFinancial.Recordset!paymenttype & "  " & format(AdoFinancial.Recordset!TTotal,"0.00")
             frmFinancialSummary.DCashSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "D.Deposit" Then
             'MsgBox "Data : DDeposit " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
             frmFinancialSummary.DDepositSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Card" Then
            'MsgBox "Data : Card " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DCardSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Cheque" Then
            'MsgBox "Data : Cheque " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DChequeSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Account" Then
            'MsgBox "Data : Account " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DAccountSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Pension" Then
            'MsgBox "Data : Pension " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DPensionSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        End If
        
        AdoFinancial.Recordset.MoveNext
    Wend
 'MsgBox "Now Split"
 PB1.Value = PB1.Value + 1
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    AdoFinancial.RecordSource = "select sum(tenderAmount) as TTotal,paymenttype from tbldata_splittender where datetime " & _
    "between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "' group by paymenttype"
    AdoFinancial.Refresh
    While Not AdoFinancial.Recordset.EOF
        'MsgBox "Data : " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
        If AdoFinancial.Recordset!paymenttype = "Cash" Then
            'MsgBox "Data : Cash " & AdoFinancial.Recordset!paymenttype & "  " & format(AdoFinancial.Recordset!TTotal,"0.00")
             frmFinancialSummary.DCashSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DCashSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "D.Deposit" Then
             'MsgBox "Data : DDeposit " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
             frmFinancialSummary.DDepositSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DDepositSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Card" Then
            'MsgBox "Data : Card " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DCardSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DCardSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Cheque" Then
            'MsgBox "Data : Cheque " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DChequeSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DChequeSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Account" Then
            'MsgBox "Data : Account " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DAccountSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DAccountSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Pension" Then
            'MsgBox "Data : Pension " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DPensionSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DPensionSales), "0.00")
        End If
        
        AdoFinancial.Recordset.MoveNext
    Wend
    
  PB1.Value = PB1.Value + 1
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "ipos"
    AdoFinancial.RecordSource = "select sum(averagecostprice*qty) as ExclCost,sum((averagecostprice*qty)*(1+vatpercentage/100)) as InclCost, " & _
    "sum(linetotal) as InclSelling,sum(linetotal/(1+vatpercentage/100)) as EXclSelling from tmpdata_current_tran"
    AdoFinancial.Refresh
    If AdoFinancial.Recordset.RecordCount <> 0 Then
        frmFinancialSummary.ExclSalesCost = format(AdoFinancial.Recordset!ExclCost, "0.00")
        If Fso.FileExists(App.path & "\GPP.TXT") = True Then
            frmFinancialSummary.InclSalesCost = format(AdoFinancial.Recordset!inclCost, "0.00")
        Else
            frmFinancialSummary.InclSalesCost = format(AdoFinancial.Recordset!inclCost, "0.00")
        End If
        frmFinancialSummary.ExclSalesSelling = format(AdoFinancial.Recordset!Exclselling, "0.00")
        frmFinancialSummary.InclSalesSelling = format(AdoFinancial.Recordset!inclselling, "0.00")
    End If
    
 PB1.Value = PB1.Value + 1
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "ipos"
    AdoFinancial.RecordSource = "select sum(averagecostprice*qty) as ExclCost,sum(linetotal) as ExclSelling from tmpdata_current_tran " & _
    " where vatpercentage=0"
    AdoFinancial.Refresh
    If AdoFinancial.Recordset.RecordCount <> 0 Then
        If Fso.FileExists(App.path & "\GPP.TXT") = True Then
            frmFinancialSummary.NONVATCost = format(AdoFinancial.Recordset!ExclCost, "0.00")
        Else
            frmFinancialSummary.NONVATCost = format(AdoFinancial.Recordset!ExclCost, "0.00")
        End If
        'frmFinancialSummary.InclSalesCost = format(AdoFinancial.Recordset!inclcost, "0.00")
        frmFinancialSummary.NONVATSelling = format(AdoFinancial.Recordset!Exclselling, "0.00")
        'frmFinancialSummary.InclSalesSelling = format(AdoFinancial.Recordset!inclselling, "0.00")
    End If
    
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "ipos"
    AdoFinancial.RecordSource = "select sum(linetotal) as REfunds from tmpdata_current_tran " & _
    " where qty<0"
    AdoFinancial.Refresh
    If AdoFinancial.Recordset.RecordCount <> 0 Then
        frmFinancialSummary.lblRefundsTotals = format(AdoFinancial.Recordset!Refunds, "0.00")
        'frmFinancialSummary.InclSalesCost = format(AdoFinancial.Recordset!inclcost, "0.00")
        'frmFinancialSummary.NONVATSelling = format(AdoFinancial.Recordset!exclselling, "0.00")
        'frmFinancialSummary.InclSalesSelling = format(AdoFinancial.Recordset!inclselling, "0.00")
    End If
PB1.Value = PB1.Value + 1
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "ipos"
    AdoFinancial.RecordSource = "select sum(averagecostprice*qty) as ExclCost,sum((averagecostprice*qty)*(1+vatpercentage/100)) as InclCost, " & _
    "sum(linetotal) as InclSelling,sum(linetotal/(1+vatpercentage/100)) as EXclSelling from tmpdata_current_tran where paymenttype='Account'"
    AdoFinancial.Refresh
    If AdoFinancial.Recordset.RecordCount <> 0 Then
        frmFinancialSummary.DrExclCostSales = format(IIf(IsNull(AdoFinancial.Recordset!ExclCost), 0, AdoFinancial.Recordset!ExclCost), "0.00")
        frmFinancialSummary.DrInclCostSales = format(IIf(IsNull(AdoFinancial.Recordset!inclCost), 0, AdoFinancial.Recordset!inclCost), "0.00")
        frmFinancialSummary.DrExclSellingSales = format(IIf(IsNull(AdoFinancial.Recordset!Exclselling), 0, AdoFinancial.Recordset!Exclselling), "0.00")
        frmFinancialSummary.DrInclSellingSales = format(IIf(IsNull(AdoFinancial.Recordset!inclselling), 0, AdoFinancial.Recordset!inclselling), "0.00")
    End If
    
 PB1.Value = PB1.Value + 1
    
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    AdoFinancial.RecordSource = "select sum(Amount) as Cashout from tbldata_CAshout " & _
    " where datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
    AdoFinancial.Refresh
    If AdoFinancial.Recordset.RecordCount <> 0 Then
        frmFinancialSummary.lblCashoutTotals = format(AdoFinancial.Recordset!cashout, "0.00")
        'frmFinancialSummary.InclSalesCost = format(AdoFinancial.Recordset!inclcost, "0.00")
        'frmFinancialSummary.NONVATSelling = format(AdoFinancial.Recordset!exclselling, "0.00")
        'frmFinancialSummary.InclSalesSelling = format(AdoFinancial.Recordset!inclselling, "0.00")
    End If
    
PB1.Value = PB1.Value + 1
    
    PayoutTotal = 0
     If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
    AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldatapayout where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                'MsgBox DTPFrom
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".amount) as TAmount from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout where " & _
                DatabaseStringValue & ".datetime>='" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                PayoutTotal = PayoutTotal + AdoFinancial.Recordset!tamount
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".amount) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout where " & _
                 DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 PayoutTotal = PayoutTotal + AdoFinancial.Recordset!tamount
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".amount) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout where " & _
                DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                PayoutTotal = PayoutTotal + AdoFinancial.Recordset!tamount
            Else
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".amount) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                AdoFinancial.Refresh
                PayoutTotal = PayoutTotal + AdoFinancial.Recordset!tamount
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile3PO
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile3PO:
            frmFinancialSummary.lblPayoutTotals = IIf(IsNull(PayoutTotal), 0, PayoutTotal)
 PB1.Value = PB1.Value + 1
    
       VoidsTotal = 0
     If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
    AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldatacancel_tran where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                'MsgBox DTPFrom
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".InclSellingPrice) as TAmount from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran where " & _
                DatabaseStringValue & ".datetime>='" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".InclSellingPrice) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran where " & _
                 DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".InclSellingPrice) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran where " & _
                DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            Else
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".InclSellingPrice) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                AdoFinancial.Refresh
                VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile3Voids
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile3Voids:
           
           frmFinancialSummary.lblVoidsTotal = IIf(IsNull(VoidsTotal), 0, VoidsTotal)
    
  PB1.Value = PB1.Value + 1
    
    
    
    
        AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
        AdoTblList.RecordSource = "select * from tbldatadebtor_tran where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
        AdoTblList.Refresh
                'MsgBox AdoTblList.Recordset.RecordCount
        If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
                
                
        While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & _
                "' group by left(" & DatabaseStringValue & ".description,3)"
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.DRInvoices = format(Val(frmFinancialSummary.DRInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.DrPayments = format(Val(frmFinancialSummary.DrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.DrDebitNotes = format(Val(frmFinancialSummary.DrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.DrCreditNotes = format(Val(frmFinancialSummary.DrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldebtor_tran where  datetime<='" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "' group by left(description,3)"
                
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.DRInvoices = format(Val(frmFinancialSummary.DRInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.DrPayments = format(Val(frmFinancialSummary.DrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.DrDebitNotes = format(Val(frmFinancialSummary.DrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.DrCreditNotes = format(Val(frmFinancialSummary.DrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & _
                "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldebtor_tran where datetime BETWEEN '" & _
                format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' AND '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & _
                "' group by left(description,3)"
                AdoFinancial.Refresh
                 While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.DRInvoices = format(Val(frmFinancialSummary.DRInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.DrPayments = format(Val(frmFinancialSummary.DrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.DrDebitNotes = format(Val(frmFinancialSummary.DrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.DrCreditNotes = format(Val(frmFinancialSummary.DrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldebtor_tran group by left(description,3)"
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Left(AdoFinancial.Recordset!Description, 3) = "Acc" Then
                        frmFinancialSummary.DRInvoices = format(Val(frmFinancialSummary.DRInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.DrPayments = format(Val(frmFinancialSummary.DrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.DrDebitNotes = format(Val(frmFinancialSummary.DrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.DrCreditNotes = format(Val(frmFinancialSummary.DrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile1DR
            End If
            AdoTblList.Recordset.MoveNext
        Wend
    
OutWhile1DR:
    
    
PB1.Value = PB1.Value + 1
  
        AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
        AdoTblList.RecordSource = "select * from tbldatacreditor_tran where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
        AdoTblList.Refresh
                'MsgBox AdoTblList.Recordset.RecordCount
        If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
                
                
        While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & _
                "' group by left(" & DatabaseStringValue & ".description,3)"
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.CrInvoices = format(Val(frmFinancialSummary.CrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.CrPayments = format(Val(frmFinancialSummary.CrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.CrDebitNotes = format(Val(frmFinancialSummary.CrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.CrCreditNotes = format(Val(frmFinancialSummary.CrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_creditors_tran where  datetime<='" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "' group by left(description,3)"
                
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.CrInvoices = format(Val(frmFinancialSummary.CrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.CrPayments = format(Val(frmFinancialSummary.CrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.CrDebitNotes = format(Val(frmFinancialSummary.CrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.CrCreditNotes = format(Val(frmFinancialSummary.CrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & _
                "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_creditors_tran where datetime BETWEEN '" & _
                format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' AND '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & _
                "' group by left(description,3)"
                AdoFinancial.Refresh
                 While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.CrInvoices = format(Val(frmFinancialSummary.CrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.CrPayments = format(Val(frmFinancialSummary.CrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.CrDebitNotes = format(Val(frmFinancialSummary.CrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.CrCreditNotes = format(Val(frmFinancialSummary.CrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.ConnectionString = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_creditors_tran group by left(description,3)"
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.CrInvoices = format(Val(frmFinancialSummary.CrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.CrPayments = format(Val(frmFinancialSummary.CrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.CrDebitNotes = format(Val(frmFinancialSummary.CrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.CrCreditNotes = format(Val(frmFinancialSummary.CrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile1CR
            End If
            AdoTblList.Recordset.MoveNext
        Wend
    
OutWhile1CR:
    
    
    
    
 PB1.Value = PB1.Value + 1
    
    
 GRV_DataFunc
    
 
            'frmFinancialSummary.lblVoidsTotal = VoidsTotal
    
    
    PB1.Value = PB1.Value + 1
    
    
    ' STAR Other Transactions Adjustments

  If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
    AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldataadjustment where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                'MsgBox DTPFrom
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(adjusttquantity*costprice) as AdjustedAmount from " & _
                DbnameA & "." & AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & _
                format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.StkAdjustments = format(frmFinancialSummary.StkAdjustments + AdoFinancial.Recordset!AdjustedAmount, "0.00")
                    
                End If
                
                
              '  VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(adjusttquantity*costprice) as AdjustedAmount from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 'VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
                 
                 If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.StkAdjustments = format(frmFinancialSummary.StkAdjustments + AdoFinancial.Recordset!AdjustedAmount, "0.00")
                    
                End If
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(adjusttquantity*costprice) as AdjustedAmount from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.StkAdjustments = format(frmFinancialSummary.StkAdjustments + AdoFinancial.Recordset!AdjustedAmount, "0.00")
                    
                End If
                'VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(adjusttquantity*costprice) as AdjustedAmount from " & DbnameA & "." & _
                AdoTblList.Recordset!Name
                AdoFinancial.Refresh
                'VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
                 If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.StkAdjustments = format(frmFinancialSummary.StkAdjustments + AdoFinancial.Recordset!AdjustedAmount, "0.00")
                    
                End If
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile3Adjusted
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile3Adjusted:
            'frmFinancialSummary.lblVoidsTotal = VoidsTotal
    ' END Other Transactions Adjustments
' Other Transactions Take
 PB1.Value = PB1.Value + 1
      If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
    AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldatastocktake where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                'MsgBox DTPFrom
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(costprice) as STockTakeAmount from " & _
                DbnameA & "." & AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & _
                format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.StkStockTake = format(frmFinancialSummary.StkStockTake + IIf(IsNull(AdoFinancial.Recordset!STockTakeAmount), 0, AdoFinancial.Recordset!STockTakeAmount), "0.00")
                    
                End If
                
                
              '  VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(costprice) as STockTakeAmount from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 'VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
                 
                 If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.StkStockTake = format(frmFinancialSummary.StkStockTake + IIf(IsNull(AdoFinancial.Recordset!STockTakeAmount), 0, AdoFinancial.Recordset!STockTakeAmount), "0.00")
                    
                End If
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(costprice) as STockTakeAmount from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.StkStockTake = format(frmFinancialSummary.StkStockTake + IIf(IsNull(AdoFinancial.Recordset!STockTakeAmount), 0, AdoFinancial.Recordset!STockTakeAmount), "0.00")
                    
                End If
                'VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(costprice) as STockTakeAmount from " & DbnameA & "." & _
                AdoTblList.Recordset!Name
                AdoFinancial.Refresh
                'VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
                 If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.StkStockTake = format(frmFinancialSummary.StkStockTake + IIf(IsNull(AdoFinancial.Recordset!STockTakeAmount), 0, AdoFinancial.Recordset!STockTakeAmount), "0.00")
                    
                End If
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile3StockTake
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile3StockTake:
    ' End Other Transactions Take
   PB1.Value = PB1.Value + 1
   
   

   
   VAT_Cal
   
   Adodc4.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
   Adodc4.RecordSource = "select Distinct(Account_Name) as ExpenseType,sum(Amount) as Amount,Sum(VatAmount) as VatAmount from tblchartofaccounts_tran " & _
   " where datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & _
   "' group by Account_Name"
   Adodc4.Refresh
    Set frmFinancialSummary.DGExpense.DataSource = Adodc4
    frmFinancialSummary.DGExpense.Columns(0).width = 2300
    frmFinancialSummary.DGExpense.Columns(1).width = 1300
    frmFinancialSummary.DGExpense.Columns(2).width = 1300
    frmFinancialSummary.DGExpense.Columns(1).Alignment = dbgRight
    frmFinancialSummary.DGExpense.Columns(2).Alignment = dbgRight
   PB1.Visible = False
   =================================================================================================================================


'    vat_cal function
frmFinancialSummary.lblVATCAL(1).Caption = frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(2).Caption = frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(3).Caption = "0.00"  'frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(4).Caption = "0.00"   'frmFinancialSummary.CrNONVATCost
   
   frmFinancialSummary.lblVATCAL(6).Caption = format(Val(frmFinancialSummary.CrExclGRVCost) - Val(frmFinancialSummary.CrNONVATCost), "0.00")
   frmFinancialSummary.lblVATCAL(7).Caption = format(Val(frmFinancialSummary.CrInclGRVCost) - Val(frmFinancialSummary.CrNONVATCost), "0.00")
   frmFinancialSummary.lblVATCAL(8).Caption = format(Val(frmFinancialSummary.lblVATCAL(7).Caption) - Val(frmFinancialSummary.lblVATCAL(6).Caption), "0.00") 'frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(9).Caption = "0.00"   'frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(18).Caption = format(Val(frmFinancialSummary.lblVATCAL(1).Caption) + Val(frmFinancialSummary.lblVATCAL(6).Caption), "0.00")
   frmFinancialSummary.lblVATCAL(17).Caption = format(Val(frmFinancialSummary.lblVATCAL(2).Caption) + Val(frmFinancialSummary.lblVATCAL(7).Caption), "0.00")
   frmFinancialSummary.lblVATCAL(16).Caption = format(Val(frmFinancialSummary.lblVATCAL(3).Caption) + Val(frmFinancialSummary.lblVATCAL(8).Caption), "0.00")
   frmFinancialSummary.lblVATCAL(15).Caption = format(Val(frmFinancialSummary.lblVATCAL(4).Caption) + Val(frmFinancialSummary.lblVATCAL(9).Caption), "0.00")
   
   
   frmFinancialSummary.lblVATCAL(13).Caption = format(Val(frmFinancialSummary.CrCreditNotes) / 1.15, "0.00")
   frmFinancialSummary.lblVATCAL(12).Caption = frmFinancialSummary.CrCreditNotes
   frmFinancialSummary.lblVATCAL(10).Caption = format(Val(frmFinancialSummary.lblVATCAL(12).Caption) - Val(frmFinancialSummary.lblVATCAL(13).Caption), "0.00")   ' "0.00"  'frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(11).Caption = "0.00"   'frmFinancialSummary.CrNONVATCost
   
   frmFinancialSummary.lblVATCAL(22).Caption = format(frmFinancialSummary.lblVATCAL(13).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(6).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(21).Caption = format(frmFinancialSummary.lblVATCAL(12).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(7).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(24).Caption = format(frmFinancialSummary.lblVATCAL(11).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(8).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(20).Caption = format(frmFinancialSummary.lblVATCAL(10).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(9).Caption, "0.00")
   
   
   frmFinancialSummary.lblVATCAL(28).Caption = format(Val(frmFinancialSummary.CrDebitNotes) / 1.15, "0.00")
   frmFinancialSummary.lblVATCAL(27).Caption = frmFinancialSummary.CrDebitNotes
   frmFinancialSummary.lblVATCAL(26).Caption = format(Val(frmFinancialSummary.lblVATCAL(27).Caption) - Val(frmFinancialSummary.lblVATCAL(28).Caption), "0.00")   ' "0.00"  'frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(25).Caption = "0.00"   'frmFinancialSummary.CrNONVATCost
   
   frmFinancialSummary.lblVATCAL(32).Caption = format(frmFinancialSummary.lblVATCAL(28).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(6).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(31).Caption = format(frmFinancialSummary.lblVATCAL(27).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(7).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(34).Caption = format(frmFinancialSummary.lblVATCAL(26).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(8).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(30).Caption = format(frmFinancialSummary.lblVATCAL(25).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(9).Caption, "0.00")
   
   
   
   frmFinancialSummary.lblVATCAL(38).Caption = format(Val(frmFinancialSummary.DrCreditNotes) / 1.15, "0.00")
   frmFinancialSummary.lblVATCAL(37).Caption = frmFinancialSummary.DrCreditNotes
   frmFinancialSummary.lblVATCAL(36).Caption = format(Val(frmFinancialSummary.lblVATCAL(37).Caption) - Val(frmFinancialSummary.lblVATCAL(38).Caption), "0.00")   ' "0.00"  'frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(35).Caption = "0.00"   'frmFinancialSummary.CrNONVATCost
   
   frmFinancialSummary.lblVATCAL(42).Caption = format(frmFinancialSummary.lblVATCAL(38).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(6).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(41).Caption = format(frmFinancialSummary.lblVATCAL(37).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(7).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(44).Caption = format(frmFinancialSummary.lblVATCAL(36).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(8).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(40).Caption = format(frmFinancialSummary.lblVATCAL(35).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(9).Caption, "0.00")
   
   
   frmFinancialSummary.lblVATCAL(48).Caption = format(Val(frmFinancialSummary.DrDebitNotes) / 1.15, "0.00")
   frmFinancialSummary.lblVATCAL(47).Caption = frmFinancialSummary.DrDebitNotes
   frmFinancialSummary.lblVATCAL(46).Caption = "0.00"
   frmFinancialSummary.lblVATCAL(45).Caption = format(Val(frmFinancialSummary.lblVATCAL(47).Caption) - Val(frmFinancialSummary.lblVATCAL(48).Caption), "0.00")   ' "0.00"  'frmFinancialSummary.CrNONVATCost   'frmFinancialSummary.CrNONVATCost
   
   frmFinancialSummary.lblVATCAL(52).Caption = format(frmFinancialSummary.lblVATCAL(48).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(6).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(51).Caption = format(frmFinancialSummary.lblVATCAL(47).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(7).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(54).Caption = format(frmFinancialSummary.lblVATCAL(46).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(8).Caption, "0.00")
   frmFinancialSummary.lblVATCAL(50).Caption = format(frmFinancialSummary.lblVATCAL(45).Caption, "0.00") ' - frmFinancialSummary.lblVATCAL(9).Caption, "0.00")
   
   
   
   'sales
   
   frmFinancialSummary.lblVATCAL(63).Caption = frmFinancialSummary.NONVATSelling
   frmFinancialSummary.lblVATCAL(62).Caption = frmFinancialSummary.NONVATSelling
   frmFinancialSummary.lblVATCAL(61).Caption = "0.00"  'frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(60).Caption = "0.00"   'frmFinancialSummary.CrNONVATCost
   
   frmFinancialSummary.lblVATCAL(58).Caption = format((Val(frmFinancialSummary.InclSalesSelling) - Val(frmFinancialSummary.NONVATSelling)) / 1.15, "0.00")
   frmFinancialSummary.lblVATCAL(57).Caption = format((Val(frmFinancialSummary.InclSalesSelling) - Val(frmFinancialSummary.NONVATSelling)), "0.00")
   frmFinancialSummary.lblVATCAL(56).Caption = "0.00" ' format(frmFinancialSummary.lblVATCAL(7).Caption - frmFinancialSummary.lblVATCAL(6).Caption, "0.00") 'frmFinancialSummary.CrNONVATCost
   frmFinancialSummary.lblVATCAL(55).Caption = format(Val(frmFinancialSummary.lblVATCAL(57).Caption) - Val(frmFinancialSummary.lblVATCAL(58).Caption), "0.00")
   
   
   frmFinancialSummary.lblVATCAL(68).Caption = format(Val(frmFinancialSummary.lblVATCAL(63).Caption) + Val(frmFinancialSummary.lblVATCAL(58).Caption), "0.00")
   frmFinancialSummary.lblVATCAL(67).Caption = format(Val(frmFinancialSummary.lblVATCAL(62).Caption) + Val(frmFinancialSummary.lblVATCAL(57).Caption), "0.00")
   frmFinancialSummary.lblVATCAL(66).Caption = format(Val(frmFinancialSummary.lblVATCAL(61).Caption) + Val(frmFinancialSummary.lblVATCAL(56).Caption), "0.00")
   frmFinancialSummary.lblVATCAL(65).Caption = format(Val(frmFinancialSummary.lblVATCAL(60).Caption) + Val(frmFinancialSummary.lblVATCAL(55).Caption), "0.00")
   
   
   frmFinancialSummary.lblVATCAL(71).Caption = format(Val(frmFinancialSummary.lblVATCAL(16)) + Val(frmFinancialSummary.lblVATCAL(24)) + Val(frmFinancialSummary.lblVATCAL(34)) + Val(frmFinancialSummary.lblVATCAL(44)) + Val(frmFinancialSummary.lblVATCAL(54)) + Val(frmFinancialSummary.lblVATCAL(66)), "0.00")

    
  frmFinancialSummary.lblVATCAL(70).Caption = format(Val(frmFinancialSummary.lblVATCAL(15)) + Val(frmFinancialSummary.lblVATCAL(20)) + Val(frmFinancialSummary.lblVATCAL(30)) + Val(frmFinancialSummary.lblVATCAL(40)) + Val(frmFinancialSummary.lblVATCAL(50)) + Val(frmFinancialSummary.lblVATCAL(65)), "0.00")

    frmFinancialSummary.StkProjecctedProfit = format(Val(frmFinancialSummary.StkInclSelling) - Val(frmFinancialSummary.StkInclCost), "0.00")
    
      '  frmFinancialSummary.DRTotalSalesProfit = format(Val(frmFinancialSummary.DrExclSellingSales) - Val(frmFinancialSummary.DrExclCostSales), "0.00")
    'Else
        frmFinancialSummary.DRTotalSalesProfit = format(Val(frmFinancialSummary.DrInclSellingSales) - Val(frmFinancialSummary.DrInclCostSales), "0.00")
    'End If
    frmFinancialSummary.DTotalSales = format(Val(frmFinancialSummary.DCashSales) + Val(frmFinancialSummary.DCardSales) + Val(frmFinancialSummary.DChequeSales) + Val(frmFinancialSummary.DAccountSales) + Val(frmFinancialSummary.DDepositSales) + Val(frmFinancialSummary.DPensionSales), "0.00")
    If Fso.FileExists(App.path & "\GPP.TXT") = True Then
        frmFinancialSummary.TotalSalesProfit = format(Val(frmFinancialSummary.InclSalesSelling) - Val(frmFinancialSummary.ExclSalesCost), "0.00")
        
    Else
        frmFinancialSummary.TotalSalesProfit = format(Val(frmFinancialSummary.ExclSalesSelling) - Val(frmFinancialSummary.ExclSalesCost), "0.00")
    End If
      frmFinancialSummary.NonVatTotals = format(Val(frmFinancialSummary.NONVATSelling) - Val(frmFinancialSummary.NONVATCost), "0.00")
      
        If Val(frmFinancialSummary.ExclSalesSelling) = 0 Or frmFinancialSummary.ExclSalesSelling = "" Then
             SellingPrice = 0
        Else
            SellingPrice = Val(frmFinancialSummary.ExclSalesSelling)
        End If
        If Val(frmFinancialSummary.ExclSalesCost) = 0 Or frmFinancialSummary.ExclSalesCost = "" Then
             CostPrice = 0
        Else
            CostPrice = Val(frmFinancialSummary.ExclSalesCost)
                
        End If
        If SellingPrice <> 0 And CostPrice <> 0 Then
            frmFinancialSummary.lblMarkup = format(((SellingPrice / CostPrice) - 1) * 100, "0.00")
        ElseIf SellingPrice = 0 And CostPrice <> 0 Then
            frmFinancialSummary.lblMarkup = 0
        ElseIf SellingPrice <> 0 And CostPrice = 0 Then
            frmFinancialSummary.lblMarkup = 100
        End If
       
        
        If SellingPrice <> 0 And CostPrice <> 0 Then
            frmFinancialSummary.lblGPP = format(((Val(SellingPrice) - Val(CostPrice)) / (SellingPrice)) * 100, "0.00")
            
            'format(((Val(txtExSelling) - Val(txtExCost)) / Val(txtExSelling)) * 100, "0.00")
            
        ElseIf SellingPrice = 0 And CostPrice <> 0 Then
            frmFinancialSummary.lblGPP = 0
        ElseIf SellingPrice <> 0 And CostPrice = 0 Then
            frmFinancialSummary.lblGPP = 100
        End If
       
        'linetotal/(1+VatPercentage/100)))-Sum(qty*AverageCostPrice)  As GPValue
       'If sellingprice <> 0 And costprice <> 0 Then
            frmFinancialSummary.lblGPV = format(Val(SellingPrice) - Val(CostPrice), "0.00")
            
            'format(((Val(txtExSelling) - Val(txtExCost)) / Val(txtExSelling)) * 100, "0.00")
            
        'ElseIf sellingprice = 0 And costprice <> 0 Then
         '   frmFinancialSummary.lblGPV = 0
        'ElseIf sellingprice <> 0 And costprice = 0 Then
        '    frmFinancialSummary.lblGPV = 100
        'End If
       ' frmFinancialSummary.lblGPP = format(((SellingPrice - Costprice) / SellingPrice) * 100, "0.00")
       
       
    If Fso.FileExists(App.path & "\GPP.TXT") = True Then
        
        strSQL = "Update " & DbnameB & ".tblTmpProdPerform set GPP = (1 - (TEC / (ExclSell)))*100 Where ExclSell <> 0 AND tec <> 0"
    Else
        strSQL = "Update " & DbnameB & ".tblTmpProdPerform set GPP = (1 - (TEC / ExclSell))*100 Where ExclSell <> 0 AND tec <> 0"
    End If



    ========================================================================================================================================================

    ' grvdata_fun Creditors Transactions
If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
    AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldatagrv where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                'MsgBox DTPFrom
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(exclusiveunitcost*quantityreceived) as ExclCost,sum(inclusiveunitcost*quantityreceived) " & _
                " as InclCost,sum(exclusiveselling*quantityreceived) as exclselling,sum(inclusiveselling*quantityreceived) as Inclselling from " & _
                DbnameA & "." & AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & _
                format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.CrExclGRVCost = format(frmFinancialSummary.CrExclGRVCost + AdoFinancial.Recordset!ExclCost, "0.00")
                    frmFinancialSummary.CrInclGRVCost = format(frmFinancialSummary.CrInclGRVCost + AdoFinancial.Recordset!inclCost, "0.00")
                    frmFinancialSummary.CrExclSelling = format(frmFinancialSummary.CrExclSelling + AdoFinancial.Recordset!Exclselling, "0.00")
                    frmFinancialSummary.CrInclGRVSelling = format(frmFinancialSummary.CrInclGRVSelling + AdoFinancial.Recordset!inclselling, "0.00")
                End If
                AdoFinancial.RecordSource = "select sum(exclusiveunitcost*quantityreceived) as ExclCost,sum(inclusiveunitcost*quantityreceived) " & _
                " as InclCost,sum(exclusiveselling*quantityreceived) as exclselling,sum(inclusiveselling*quantityreceived) as Inclselling from " & _
                DbnameA & "." & AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & _
                format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and vatpercentage=0"
                AdoFinancial.Refresh
                
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.CrNONVATCost = format(frmFinancialSummary.CrNONVATCost + AdoFinancial.Recordset!ExclCost, "0.00")
                    frmFinancialSummary.CrNONVATSelling = format(frmFinancialSummary.CrNONVATSelling + AdoFinancial.Recordset!Exclselling, "0.00")
                   
                End If
                
              '  VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(exclusiveunitcost*quantityreceived) as ExclCost,sum(inclusiveunitcost*quantityreceived) " & _
                " as InclCost,sum(exclusiveselling*quantityreceived) as exclselling,sum(inclusiveselling*quantityreceived) as Inclselling from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 'VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
                 
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.CrExclGRVCost = format(frmFinancialSummary.CrExclGRVCost + AdoFinancial.Recordset!ExclCost, "0.00")
                    frmFinancialSummary.CrInclGRVCost = format(frmFinancialSummary.CrInclGRVCost + AdoFinancial.Recordset!inclCost, "0.00")
                    frmFinancialSummary.CrExclSelling = format(frmFinancialSummary.CrExclSelling + AdoFinancial.Recordset!Exclselling, "0.00")
                    frmFinancialSummary.CrInclGRVSelling = format(frmFinancialSummary.CrInclGRVSelling + AdoFinancial.Recordset!inclselling, "0.00")
                End If
                
                AdoFinancial.RecordSource = "select sum(exclusiveunitcost*quantityreceived) as ExclCost,sum(inclusiveunitcost*quantityreceived) " & _
                " as InclCost,sum(exclusiveselling*quantityreceived) as exclselling,sum(inclusiveselling*quantityreceived) as Inclselling from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "' " & _
                " and vatpercentage=0"
                AdoFinancial.Refresh
                
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.CrNONVATCost = format(frmFinancialSummary.CrNONVATCost + AdoFinancial.Recordset!ExclCost, "0.00")
                    frmFinancialSummary.CrNONVATSelling = format(frmFinancialSummary.CrNONVATSelling + AdoFinancial.Recordset!Exclselling, "0.00")
                   
                End If
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(exclusiveunitcost*quantityreceived) as ExclCost,sum(inclusiveunitcost*quantityreceived) " & _
                " as InclCost,sum(exclusiveselling*quantityreceived) as exclselling,sum(inclusiveselling*quantityreceived) as Inclselling from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.CrExclGRVCost = format(frmFinancialSummary.CrExclGRVCost + AdoFinancial.Recordset!ExclCost, "0.00")
                    frmFinancialSummary.CrInclGRVCost = format(frmFinancialSummary.CrInclGRVCost + AdoFinancial.Recordset!inclCost, "0.00")
                    frmFinancialSummary.CrExclSelling = format(frmFinancialSummary.CrExclSelling + AdoFinancial.Recordset!Exclselling, "0.00")
                    frmFinancialSummary.CrInclGRVSelling = format(frmFinancialSummary.CrInclGRVSelling + AdoFinancial.Recordset!inclselling, "0.00")
                End If
                'VoidsTotal= VoidsTotal + AdoFinancial.Recordset!tamount
                AdoFinancial.RecordSource = "select sum(exclusiveunitcost*quantityreceived) as ExclCost,sum(inclusiveunitcost*quantityreceived) " & _
                " as InclCost,sum(exclusiveselling*quantityreceived) as exclselling,sum(inclusiveselling*quantityreceived) as Inclselling from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "' and vatpercentage=0"
                AdoFinancial.Refresh
                
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.CrNONVATCost = format(frmFinancialSummary.CrNONVATCost + AdoFinancial.Recordset!ExclCost, "0.00")
                    frmFinancialSummary.CrNONVATSelling = format(frmFinancialSummary.CrNONVATSelling + AdoFinancial.Recordset!Exclselling, "0.00")
                   
                End If
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(exclusiveunitcost*quantityreceived) as ExclCost,sum(inclusiveunitcost*quantityreceived) " & _
                " as InclCost,sum(exclusiveselling*quantityreceived) as exclselling,sum(inclusiveselling*quantityreceived) as Inclselling from " & DbnameA & "." & _
                AdoTblList.Recordset!Name
                AdoFinancial.Refresh
                'VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.CrExclGRVCost = format(frmFinancialSummary.CrExclGRVCost + AdoFinancial.Recordset!ExclCost, "0.00")
                    frmFinancialSummary.CrInclGRVCost = format(frmFinancialSummary.CrInclGRVCost + AdoFinancial.Recordset!inclCost, "0.00")
                    frmFinancialSummary.CrExclSelling = format(frmFinancialSummary.CrExclSelling + AdoFinancial.Recordset!Exclselling, "0.00")
                    frmFinancialSummary.CrInclGRVSelling = format(frmFinancialSummary.CrInclGRVSelling + AdoFinancial.Recordset!inclselling, "0.00")
                End If
                
                AdoFinancial.RecordSource = "select sum(exclusiveunitcost*quantityreceived) as ExclCost,sum(inclusiveunitcost*quantityreceived) " & _
                " as InclCost,sum(exclusiveselling*quantityreceived) as exclselling,sum(inclusiveselling*quantityreceived) as Inclselling from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where vatpercentage=0"
                AdoFinancial.Refresh
                If AdoFinancial.Recordset.RecordCount <> 0 Then
                    frmFinancialSummary.CrNONVATCost = format(frmFinancialSummary.CrNONVATCost + AdoFinancial.Recordset!ExclCost, "0.00")
                    frmFinancialSummary.CrNONVATSelling = format(frmFinancialSummary.CrNONVATSelling + AdoFinancial.Recordset!Exclselling, "0.00")
                   
                End If
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile3Creditortran
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile3Creditortran:
' END Creditors Transactions
======================================================================================================================

' Other Transactions Creditor 
AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
        AdoTblList.RecordSource = "select * from tbldatacreditor_tran where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
        AdoTblList.Refresh
                'MsgBox AdoTblList.Recordset.RecordCount
        If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
                
                
        While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & _
                "' group by left(" & DatabaseStringValue & ".description,3)"
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.CrInvoices = format(Val(frmFinancialSummary.CrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.CrPayments = format(Val(frmFinancialSummary.CrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.CrDebitNotes = format(Val(frmFinancialSummary.CrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.CrCreditNotes = format(Val(frmFinancialSummary.CrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_creditors_tran where  datetime<='" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "' group by left(description,3)"
                
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.CrInvoices = format(Val(frmFinancialSummary.CrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.CrPayments = format(Val(frmFinancialSummary.CrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.CrDebitNotes = format(Val(frmFinancialSummary.CrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.CrCreditNotes = format(Val(frmFinancialSummary.CrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & _
                "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_creditors_tran where datetime BETWEEN '" & _
                format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' AND '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & _
                "' group by left(description,3)"
                AdoFinancial.Refresh
                 While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.CrInvoices = format(Val(frmFinancialSummary.CrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.CrPayments = format(Val(frmFinancialSummary.CrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.CrDebitNotes = format(Val(frmFinancialSummary.CrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.CrCreditNotes = format(Val(frmFinancialSummary.CrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.ConnectionString = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_creditors_tran group by left(description,3)"
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.CrInvoices = format(Val(frmFinancialSummary.CrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.CrPayments = format(Val(frmFinancialSummary.CrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.CrDebitNotes = format(Val(frmFinancialSummary.CrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.CrCreditNotes = format(Val(frmFinancialSummary.CrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile1CR
            End If
            AdoTblList.Recordset.MoveNext
        Wend
    
OutWhile1CR:

'END Other Transactions Creditor 

' Debtors Transactions

AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
        AdoTblList.RecordSource = "select * from tbldatadebtor_tran where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
        AdoTblList.Refresh
                'MsgBox AdoTblList.Recordset.RecordCount
        If CnHost.State Then
        CnHost.Close
    End If
    CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    'CnHost.Execute "delete from tbltmppayout"
    'CnHost.Close
     '           CnHost.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "IPOS"
    If CnConnection.State = 1 Then
        CnConnection.Close
    End If
    CnConnection.Open "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "history"
    DbnameA = CnConnection.DefaultDatabase
    DbnameB = CnHost.DefaultDatabase
                
                
        While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & _
                "' group by left(" & DatabaseStringValue & ".description,3)"
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.DrInvoices = format(Val(frmFinancialSummary.DrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.DrPayments = format(Val(frmFinancialSummary.DrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.DrDebitNotes = format(Val(frmFinancialSummary.DrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.DrCreditNotes = format(Val(frmFinancialSummary.DrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldebtor_tran where  datetime<='" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "' group by left(description,3)"
                
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.DrInvoices = format(Val(frmFinancialSummary.DrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.DrPayments = format(Val(frmFinancialSummary.DrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.DrDebitNotes = format(Val(frmFinancialSummary.DrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.DrCreditNotes = format(Val(frmFinancialSummary.DrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & _
                "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldebtor_tran where datetime BETWEEN '" & _
                format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' AND '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & _
                "' group by left(description,3)"
                AdoFinancial.Refresh
                 While Not AdoFinancial.Recordset.EOF
                    If Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Acc" Then
                        frmFinancialSummary.DrInvoices = format(Val(frmFinancialSummary.DrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.DrPayments = format(Val(frmFinancialSummary.DrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.DrDebitNotes = format(Val(frmFinancialSummary.DrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.DrCreditNotes = format(Val(frmFinancialSummary.DrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = " select sum(" & DatabaseStringValue & ".amount) as TAmount,description from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldebtor_tran group by left(description,3)"
                AdoFinancial.Refresh
                While Not AdoFinancial.Recordset.EOF
                    If Left(AdoFinancial.Recordset!Description, 3) = "Acc" Then
                        frmFinancialSummary.DrInvoices = format(Val(frmFinancialSummary.DrInvoices) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Pay" Then
                        frmFinancialSummary.DrPayments = format(Val(frmFinancialSummary.DrPayments) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Deb" Then
                        frmFinancialSummary.DrDebitNotes = format(Val(frmFinancialSummary.DrDebitNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    ElseIf Mid$(AdoFinancial.Recordset!Description, 1, 3) = "Cre" Then
                        frmFinancialSummary.DrCreditNotes = format(Val(frmFinancialSummary.DrCreditNotes) + AdoFinancial.Recordset!tamount, "0.00")
                    End If
                      '  MsgBox "Data : " & AdoFinancial.Recordset!Description & "  " & AdoFinancial.Recordset!tamount
                    
                    AdoFinancial.Recordset.MoveNext
                Wend
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile1DR
            End If
            AdoTblList.Recordset.MoveNext
        Wend
    
OutWhile1DR:
'END  Debtors Transactions
' Sales Breakdown
AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldatacurrent_tran where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                'MsgBox DTPFrom
                CnHost.Execute "insert into " & DbnameB & ".tmpdata_current_tran select * from " & DbnameA & "." & _
                AdoTblList.Recordset!Name & " where " & DatabaseStringValue & ".datetime>='" & _
                format(DTPFrom.Value, "YYYY-MM-DD") & " " & format(DTPTIMEFROM.Value, "hh:mm:ss") & "'"
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                CnHost.Execute "insert into " & DbnameB & ".tmpdata_current_tran select * from " & DbnameA & "." & AdoTblList.Recordset!Name & _
                "  where " & DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD") & " " & _
                format(DTPTIMETO.Value, "hh:mm:ss") & "'"
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                CnHost.Execute "insert into " & DbnameB & ".tmpdata_current_tran select * from " & DbnameA & "." & AdoTblList.Recordset!Name & _
                " where " & DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD") & " " & _
                format(DTPTIMEFROM.Value, "hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD") & " " & format(DTPTIMETO.Value, "hh:mm:ss") & "'"
            Else
                DatabaseStringValue = DbnameA & "." & AdoTblList.Recordset!Name
                CnHost.Execute "insert into " & DbnameB & ".tmpdata_current_tran select * from " & DbnameA & "." & AdoTblList.Recordset!Name
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile30
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile30:
    
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "ipos"
    AdoFinancial.RecordSource = "select sum(linetotal) as TTotal,paymenttype from tmpdata_current_tran group by paymenttype"
    AdoFinancial.Refresh
    While Not AdoFinancial.Recordset.EOF
        'MsgBox "Data : " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
        If AdoFinancial.Recordset!paymenttype = "Cash" Then
            'MsgBox "Data : Cash " & AdoFinancial.Recordset!paymenttype & "  " & format(AdoFinancial.Recordset!TTotal,"0.00")
             frmFinancialSummary.DCashSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "D.Deposit" Then
             'MsgBox "Data : DDeposit " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
             frmFinancialSummary.DDepositSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Card" Then
            'MsgBox "Data : Card " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DCardSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Cheque" Then
            'MsgBox "Data : Cheque " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DChequeSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Account" Then
            'MsgBox "Data : Account " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DAccountSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Pension" Then
            'MsgBox "Data : Pension " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DPensionSales = format(AdoFinancial.Recordset!TTotal, "0.00")
        End If
        
        AdoFinancial.Recordset.MoveNext
    Wend
 'MsgBox "Now Split"
 PB1.Value = PB1.Value + 1
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    AdoFinancial.RecordSource = "select sum(tenderAmount) as TTotal,paymenttype from tbldata_splittender where datetime " & _
    "between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "' group by paymenttype"
    AdoFinancial.Refresh
    While Not AdoFinancial.Recordset.EOF
        'MsgBox "Data : " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
        If AdoFinancial.Recordset!paymenttype = "Cash" Then
            'MsgBox "Data : Cash " & AdoFinancial.Recordset!paymenttype & "  " & format(AdoFinancial.Recordset!TTotal,"0.00")
             frmFinancialSummary.DCashSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DCashSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "D.Deposit" Then
             'MsgBox "Data : DDeposit " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
             frmFinancialSummary.DDepositSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DDepositSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Card" Then
            'MsgBox "Data : Card " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DCardSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DCardSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Cheque" Then
            'MsgBox "Data : Cheque " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DChequeSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DChequeSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Account" Then
            'MsgBox "Data : Account " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DAccountSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DAccountSales), "0.00")
        ElseIf AdoFinancial.Recordset!paymenttype = "Pension" Then
            'MsgBox "Data : Pension " & AdoFinancial.Recordset!paymenttype & "  " & AdoFinancial.Recordset!TTotal
            frmFinancialSummary.DPensionSales = format(AdoFinancial.Recordset!TTotal + Val(frmFinancialSummary.DPensionSales), "0.00")
        End If
        
        AdoFinancial.Recordset.MoveNext
    Wend
    
  PB1.Value = PB1.Value + 1
    AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "ipos"
    AdoFinancial.RecordSource = "select sum(averagecostprice*qty) as ExclCost,sum((averagecostprice*qty)*(1+vatpercentage/100)) as InclCost, " & _
    "sum(linetotal) as InclSelling,sum(linetotal/(1+vatpercentage/100)) as EXclSelling from tmpdata_current_tran"
    AdoFinancial.Refresh
' ENDSales Breakdown

' Sales Breakdown Other Transactions payout
AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldatapayout where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                'MsgBox DTPFrom
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".amount) as TAmount from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout where " & _
                DatabaseStringValue & ".datetime>='" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                PayoutTotal = PayoutTotal + AdoFinancial.Recordset!tamount
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".amount) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout where " & _
                 DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 PayoutTotal = PayoutTotal + AdoFinancial.Recordset!tamount
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".amount) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout where " & _
                DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                PayoutTotal = PayoutTotal + AdoFinancial.Recordset!tamount
            Else
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".amount) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tblpayout"
                AdoFinancial.Refresh
                PayoutTotal = PayoutTotal + AdoFinancial.Recordset!tamount
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile3PO
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile3PO:
            frmFinancialSummary.lblPayoutTotals = IIf(IsNull(PayoutTotal), 0, PayoutTotal)
' END Sales Breakdown Other Transactions payout
' Sales Breakdown Other Transactions cash
AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "data"
    AdoFinancial.RecordSource = "select sum(Amount) as Cashout from tbldata_CAshout " & _
    " where datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
    AdoFinancial.Refresh
    If AdoFinancial.Recordset.RecordCount <> 0 Then
        frmFinancialSummary.lblCashoutTotals = format(AdoFinancial.Recordset!cashout, "0.00")
    
    End If
' END Sales Breakdown Other Transactions cash
' Sales Breakdown Other Transactions Refunds
AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "ipos"
'    tbldata_current_tran use krna hia with date is replace kr k tmpdata_current_tran
    AdoFinancial.RecordSource = "select sum(linetotal) as REfunds from tmpdata_current_tran " & _
    " where qty<0"
    AdoFinancial.Refresh
    If AdoFinancial.Recordset.RecordCount <> 0 Then
        frmFinancialSummary.lblRefundsTotals = format(AdoFinancial.Recordset!Refunds, "0.00")
       
    End If
' END Sales Breakdown Other Transactions Refunds

'   Sales Breakdown Other Transactions void
AdoTblList.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
    AdoTblList.RecordSource = "select * from tbldatacancel_tran where left(name,6)>='" & format(DTPFrom.Value, "YYYYMM") & "'"
    AdoTblList.Refresh
         While Not AdoTblList.Recordset.EOF
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPFrom.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                'MsgBox DTPFrom
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".InclSellingPrice) as TAmount from " & DbnameA & "." & _
                Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran where " & _
                DatabaseStringValue & ".datetime>='" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            ElseIf Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") And (format(DTPFrom.Value, "MM") <> format(DTPTo.Value, "MM")) Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".InclSellingPrice) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran where " & _
                 DatabaseStringValue & ".datetime <='" & format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                 VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            ElseIf format(DTPFrom.Value, "MM") = format(DTPTo.Value, "MM") Then
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".InclSellingPrice) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran where " & _
                DatabaseStringValue & ".datetime between '" & format(DTPFrom.Value, "YYYY-MM-DD hh:mm:ss") & "' and '" & _
                format(DTPTo.Value, "YYYY-MM-DD hh:mm:ss") & "'"
                AdoFinancial.Refresh
                VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            Else
                DatabaseStringValue = DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                AdoFinancial.ConnectionString = "Provider=MSDASQL.1;Persist Security Info=False;Data Source=" & frmMain.STB1.Panels.Item(6) & "HISTORY"
                AdoFinancial.RecordSource = "select sum(" & DatabaseStringValue & ".InclSellingPrice) as TAmount from " & DbnameA & "." & Mid$(AdoTblList.Recordset!Name, 1, 6) & "tbldata_cancel_tran"
                AdoFinancial.Refresh
                VoidsTotal = VoidsTotal + AdoFinancial.Recordset!tamount
            End If
            If Mid$(AdoTblList.Recordset!Name, 1, 6) = format(DTPTo.Value, "YYYYMM") Then
                GoTo OutWhile3Voids
            End If
            AdoTblList.Recordset.MoveNext
         Wend

OutWhile3Voids:
           
           frmFinancialSummary.lblVoidsTotal = IIf(IsNull(VoidsTotal), 0, VoidsTotal)
'  END Sales Breakdown Other Transactions void

' Profit Statistics


' END Profit Statistics



